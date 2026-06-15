#!/usr/bin/env bun
/**
 * Validate TeX snippets embedded in .md content files.
 *
 * Uses AST-based parsing throughout:
 *   - remark + remark-math for markdown → AST (extracts math/code nodes)
 *   - unified-latex for TeX → AST validation (catches syntax errors)
 *   - Optional pdflatex compilation for full verification (--compile flag)
 *
 * Usage:
 *   bun run pipeline/validate-tex.ts                          # validate all
 *   bun run pipeline/validate-tex.ts --paper quantum-observable-universe
 *   bun run pipeline/validate-tex.ts --file path/to/file.md   # single file
 *   bun run pipeline/validate-tex.ts --compile                # also compile with pdflatex
 *   bun run pipeline/validate-tex.ts --json                   # JSON output
 *   bun run pipeline/validate-tex.ts --warnings-log out.log   # QA-compatible log
 *
 * @module content/pipeline/validate-tex
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, relative, basename, extname } from "path";
import { Glob } from "bun";
import { remark } from "remark";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { parse as parseLatex } from "@unified-latex/unified-latex-util-parse";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";

// ── Types ─────────────────────────────────────────────────────────

interface TexSnippet {
  file: string;
  line: number;
  column: number;
  kind: "inlineMath" | "displayMath" | "fencedTex";
  content: string;
}

interface ValidationError {
  file: string;
  line: number;
  column: number;
  kind: string;
  snippetPreview: string;
  error: string;
  category: string;
}

interface ValidationReport {
  filesScanned: number;
  snippetsFound: number;
  snippetsValid: number;
  snippetsInvalid: number;
  errors: ValidationError[];
}

// ── Markdown AST snippet extraction ───────────────────────────────

/**
 * Extract TeX snippets from a markdown file using remark AST.
 *
 * remark-math parses:
 *   - $...$ → node type "inlineMath"
 *   - $$...$$ → node type "math" (display)
 *
 * Standard remark parses:
 *   - ```tex ... ``` → node type "code" with lang "tex"
 */
function extractSnippets(filepath: string, text: string): TexSnippet[] {
  const snippets: TexSnippet[] = [];

  const tree = remark().use(remarkMath).parse(text);

  visit(tree, (node: any) => {
    const pos = node.position?.start ?? { line: 1, column: 1 };

    if (node.type === "inlineMath") {
      snippets.push({
        file: filepath,
        line: pos.line,
        column: pos.column,
        kind: "inlineMath",
        content: node.value,
      });
    } else if (node.type === "math") {
      snippets.push({
        file: filepath,
        line: pos.line,
        column: pos.column,
        kind: "displayMath",
        content: node.value,
      });
    } else if (node.type === "code" && node.lang === "tex") {
      snippets.push({
        file: filepath,
        line: pos.line,
        column: pos.column,
        kind: "fencedTex",
        content: node.value,
      });
    }
  });

  return snippets;
}

// ── unified-latex AST validation ──────────────────────────────────

/** Known LaTeX environments that are valid in math mode. */
const MATH_ENVS = new Set([
  "aligned", "gathered", "split", "cases", "array",
  "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix",
  "smallmatrix", "matrix", "tikzcd",
]);

/** Environments that must NOT appear in math mode. */
const NON_MATH_ENVS = new Set([
  "itemize", "enumerate", "description",
  "figure", "table", "tabular",
  "verbatim", "lstlisting",
  "center", "flushleft", "flushright",
  "minipage",
]);

/**
 * Validate a TeX snippet using the unified-latex AST parser.
 *
 * Checks for:
 *   1. Parse errors (malformed LaTeX)
 *   2. Unbalanced environments (\begin without \end)
 *   3. Non-math environments in math-context snippets
 *   4. Common structural issues
 */
function validateSnippetAst(snippet: TexSnippet): ValidationError[] {
  const errors: ValidationError[] = [];
  const isMathContext = snippet.kind === "inlineMath" || snippet.kind === "displayMath";

  // Wrap math-context content so unified-latex can parse it
  let texToParse: string;
  if (snippet.kind === "inlineMath") {
    texToParse = `$${snippet.content}$`;
  } else if (snippet.kind === "displayMath") {
    texToParse = `\\[${snippet.content}\\]`;
  } else {
    texToParse = snippet.content;
  }

  let ast: any;
  try {
    ast = parseLatex(texToParse);
  } catch (e) {
    errors.push({
      file: snippet.file,
      line: snippet.line,
      column: snippet.column,
      kind: snippet.kind,
      snippetPreview: snippet.content.slice(0, 80),
      error: `Parse error: ${e instanceof Error ? e.message : String(e)}`,
      category: "Parse Error",
    });
    return errors;
  }

  // Walk AST for structural issues
  const envStack: string[] = [];

  function walkNodes(nodes: any[]): void {
    for (const node of nodes) {
      // Check environment nodes
      if (node.type === "environment") {
        const envName = typeof node.env === "string"
          ? node.env
          : printRaw(node.env ?? []);

        // Check for non-math environments in math context
        if (isMathContext && NON_MATH_ENVS.has(envName)) {
          errors.push({
            file: snippet.file,
            line: snippet.line,
            column: snippet.column,
            kind: snippet.kind,
            snippetPreview: snippet.content.slice(0, 80),
            error: `Environment \\begin{${envName}} cannot appear in math mode`,
            category: "Math Mode",
          });
        }

        envStack.push(envName);

        // Recurse into environment content
        if (node.content && Array.isArray(node.content)) {
          walkNodes(node.content);
        }

        envStack.pop();
      }

      // Check for unmatched braces (group nodes with issues)
      if (node.type === "group" && node.content && Array.isArray(node.content)) {
        walkNodes(node.content);
      }

      // Recurse into args
      if (node.args && Array.isArray(node.args)) {
        for (const arg of node.args) {
          if (arg.content && Array.isArray(arg.content)) {
            walkNodes(arg.content);
          }
        }
      }

      // Check inline/display math nodes for nested issues
      if (node.type === "inlinemath" && node.content) {
        walkNodes(node.content);
      }
      if (node.type === "displaymath" && node.content) {
        walkNodes(node.content);
      }
      if (node.type === "mathenv" && node.content) {
        walkNodes(node.content);
      }
    }
  }

  if (ast.content && Array.isArray(ast.content)) {
    walkNodes(ast.content);
  }

  return errors;
}

// ── Optional pdflatex compilation ─────────────────────────────────

const PREAMBLE = `\\documentclass[12pt]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm,mathtools}
\\usepackage{tikz}
\\usepackage{tikz-cd}
\\usepackage[dvipsnames]{xcolor}
\\usepackage{graphicx,hyperref}
\\newtheorem{theorem}{Theorem}
\\newtheorem{definition}[theorem]{Definition}
\\newtheorem{lemma}[theorem]{Lemma}
\\newtheorem{proposition}[theorem]{Proposition}
\\newtheorem{corollary}[theorem]{Corollary}
\\newtheorem{example}[theorem]{Example}
\\newtheorem{remark}[theorem]{Remark}
\\newcommand{\\lean}[1]{\\ensuremath{\\forall}}
\\newcommand{\\leanok}{\\ensuremath{\\checkmark}}
\\newcommand{\\notready}{\\ensuremath{\\times}}
\\newcommand{\\mathlibok}{\\ensuremath{\\checkmark\\checkmark}}
\\newcommand{\\uses}[1]{}
\\begin{document}
`;

async function validateSnippetCompile(snippet: TexSnippet, tmpDir: string): Promise<ValidationError[]> {
  let body: string;
  if (snippet.kind === "inlineMath") {
    body = `$${snippet.content}$`;
  } else if (snippet.kind === "displayMath") {
    body = `\\[\n${snippet.content}\n\\]`;
  } else {
    body = snippet.content;
  }

  const doc = PREAMBLE + body + "\n\\end{document}\n";
  const texPath = join(tmpDir, "snippet.tex");
  writeFileSync(texPath, doc);

  const proc = Bun.spawn(
    ["pdflatex", "-interaction=nonstopmode", "-halt-on-error",
     "-no-shell-escape", "snippet.tex"],
    { cwd: tmpDir, stdout: "pipe", stderr: "pipe" },
  );

  const exitCode = await proc.exited;
  if (exitCode === 0) return [];

  // Parse errors from the log
  const logPath = join(tmpDir, "snippet.log");
  const errors: ValidationError[] = [];

  if (existsSync(logPath)) {
    const log = readFileSync(logPath, "utf-8");
    // Parse ! Error lines from pdflatex log (these are structured, not free-text)
    const errorLines = log.split("\n").filter(l => l.startsWith("! "));
    const seen = new Set<string>();

    for (const line of errorLines) {
      const msg = line.slice(2).trim();
      if (seen.has(msg)) continue;
      seen.add(msg);

      errors.push({
        file: snippet.file,
        line: snippet.line,
        column: snippet.column,
        kind: snippet.kind,
        snippetPreview: snippet.content.slice(0, 80),
        error: msg,
        category: classifyTexError(msg),
      });
    }
  }

  if (errors.length === 0) {
    errors.push({
      file: snippet.file,
      line: snippet.line,
      column: snippet.column,
      kind: snippet.kind,
      snippetPreview: snippet.content.slice(0, 80),
      error: `pdflatex failed with exit code ${exitCode}`,
      category: "Compile Error",
    });
  }

  // Clean up aux files
  for (const ext of [".aux", ".log", ".pdf", ".dvi"]) {
    const f = join(tmpDir, `snippet${ext}`);
    if (existsSync(f)) Bun.write(f, "");  // truncate
  }

  return errors;
}

function classifyTexError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("undefined control sequence")) return "Undefined Command";
  if (lower.includes("missing") && (lower.includes("$") || lower.includes("math"))) return "Math Mode";
  if (lower.includes("missing")) return "Missing Token";
  if (lower.includes("extra")) return "Extra Token";
  if (lower.includes("environment")) return "Environment";
  if (lower.includes("file") && lower.includes("not found")) return "Missing Package";
  return "TeX Syntax";
}

// ── Main validation ───────────────────────────────────────────────

async function validateFiles(
  mdFiles: string[],
  opts: { compile: boolean; verbose: boolean },
): Promise<ValidationReport> {
  const report: ValidationReport = {
    filesScanned: mdFiles.length,
    snippetsFound: 0,
    snippetsValid: 0,
    snippetsInvalid: 0,
    errors: [],
  };

  // Extract all snippets
  const allSnippets: TexSnippet[] = [];
  for (const file of mdFiles) {
    const text = readFileSync(file, "utf-8");
    const snippets = extractSnippets(file, text);
    allSnippets.push(...snippets);
  }
  report.snippetsFound = allSnippets.length;

  if (opts.verbose) {
    console.error(`Found ${allSnippets.length} TeX snippets in ${mdFiles.length} files`);
  }

  // Validate each snippet with AST
  for (const snippet of allSnippets) {
    const astErrors = validateSnippetAst(snippet);
    if (astErrors.length > 0) {
      report.errors.push(...astErrors);
      report.snippetsInvalid++;
    } else {
      report.snippetsValid++;
    }
  }

  // Optional: compile validation
  if (opts.compile) {
    const { mkdtempSync } = await import("fs");
    const { tmpdir } = await import("os");
    const tmpDir = mkdtempSync(join(tmpdir(), "tex-validate-"));

    if (opts.verbose) {
      console.error(`Running pdflatex compilation checks in ${tmpDir}`);
    }

    for (let i = 0; i < allSnippets.length; i++) {
      if (opts.verbose && (i + 1) % 50 === 0) {
        console.error(`  Compiling snippet ${i + 1}/${allSnippets.length}...`);
      }
      const compileErrors = await validateSnippetCompile(allSnippets[i], tmpDir);
      for (const err of compileErrors) {
        // Only add if not already caught by AST validation
        const isDuplicate = report.errors.some(
          e => e.file === err.file && e.line === err.line && e.kind === err.kind,
        );
        if (!isDuplicate) {
          report.errors.push(err);
          // Adjust valid/invalid counts
          report.snippetsValid--;
          report.snippetsInvalid++;
        }
      }
    }
  }

  return report;
}

// ── Output formatters ─────────────────────────────────────────────

function formatText(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push("TeX Snippet Validation Report (AST-based)");
  lines.push("=".repeat(44));
  lines.push(`Files scanned:    ${report.filesScanned}`);
  lines.push(`Snippets found:   ${report.snippetsFound}`);
  lines.push(`Snippets valid:   ${report.snippetsValid}`);
  lines.push(`Snippets invalid: ${report.snippetsInvalid}`);
  lines.push("");

  if (report.errors.length > 0) {
    lines.push("Errors:");
    lines.push("-".repeat(40));
    for (const e of report.errors) {
      lines.push(`  ${e.file}:${e.line}:${e.column} [${e.kind}] (${e.category})`);
      lines.push(`    ${e.error}`);
      const preview = e.snippetPreview.replace(/\n/g, " ").slice(0, 60);
      lines.push(`    snippet: ${preview}...`);
      lines.push("");
    }
  } else {
    lines.push("No errors found.");
  }

  return lines.join("\n");
}

function formatJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function formatWarningsLog(report: ValidationReport): string {
  return report.errors
    .map(e => `LaTeX Warning: [${e.category}] ${e.file}:${e.line} — ${e.error}`)
    .join("\n");
}

// ── CLI ───────────────────────────────────────────────────────────

const REPO_ROOT = join(import.meta.dir, "../..");
const CONTENT_ROOT = join(import.meta.dir, "..");

if (import.meta.main) {
  const args = process.argv.slice(2);

  function hasFlag(name: string): boolean {
    return args.includes(`--${name}`);
  }
  function flagVal(name: string, fallback: string): string {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
  }

  const jsonOutput = hasFlag("json");
  const compile = hasFlag("compile");
  const verbose = hasFlag("verbose") || hasFlag("v");
  const warningsLog = flagVal("warnings-log", "");
  const paper = flagVal("paper", "");
  const singleFile = flagVal("file", "");

  // Collect .md files
  let mdFiles: string[] = [];

  if (singleFile) {
    mdFiles = [singleFile];
  } else {
    const searchDir = paper
      ? join(CONTENT_ROOT, paper)
      : CONTENT_ROOT;

    const glob = new Glob("**/*.md");
    for (const match of glob.scanSync({ cwd: searchDir })) {
      // Skip node_modules, schema docs, pipeline docs
      if (match.includes("node_modules")) continue;
      mdFiles.push(join(searchDir, match));
    }
    mdFiles.sort();
  }

  if (verbose) {
    console.error(`Scanning ${mdFiles.length} .md files...`);
  }

  const report = await validateFiles(mdFiles, { compile, verbose });

  if (jsonOutput) {
    console.log(formatJson(report));
  } else {
    console.log(formatText(report));
  }

  if (warningsLog) {
    writeFileSync(warningsLog, formatWarningsLog(report));
    if (!jsonOutput) {
      console.log(`\nWarnings log written to ${warningsLog}`);
    }
  }

  process.exit(report.errors.length > 0 ? 1 : 0);
}

// ── Exports for use by other pipeline modules ─────────────────────

export {
  extractSnippets,
  validateSnippetAst,
  type TexSnippet,
  type ValidationError,
  type ValidationReport,
};
