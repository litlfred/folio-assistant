/**
 * Render tools — PDF, HTML, and formula preview.
 *
 * Tools:
 *   paper_render_pdf   — Render full paper, chapter, or section to PDF
 *   paper_render_html  — Render to HTML (via pandoc)
 *   formula_render     — Quick-render a single formula/diagram to PNG
 *
 * @module scripts/mcp-server/tools/render
 */

import { z } from "zod";
import { execSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { REPO_ROOT, BUILD_DIR, MAIN_TEX, CHAPTERS_DIR } from "../paths.js";
// Note: paths are resolved from the paper adapter's paths module.

/** Check if a command is available on PATH. */
function hasCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function registerRenderTools(server: McpServer): void {

  // ── paper_render_pdf ─────────────────────────────────────────

  server.tool(
    "paper_render_pdf",
    "Render the paper (or a chapter/section) to PDF using latexmk. " +
    "Returns the path to the generated PDF.",
    {
      scope: z.enum(["full", "chapter", "section"]).default("full")
        .describe("What to render: full paper, single chapter, or section"),
      target: z.string().optional()
        .describe("Chapter or section identifier (e.g. 'quantum-observable-universe'). Required if scope != full."),
      engine: z.enum(["pdflatex", "lualatex", "xelatex"]).default("pdflatex")
        .describe("LaTeX engine to use"),
      clean: z.boolean().default(false)
        .describe("Run latexmk -C first to clean auxiliary files"),
      print_mode: z.enum(["formal", "compact"]).default("compact")
        .describe("Print mode: formal (with affiliations) or compact (dense, no affiliations)"),
    },
    async ({ scope, target, engine, clean, print_mode }) => {
      // Check deps
      if (!hasCommand("latexmk")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: latexmk not installed. Run: ./scripts/mcp-server/install.sh\n" +
              "Or install TeX Live: apt install texlive-full (Ubuntu) / port install texlive (macOS)",
          }],
        };
      }

      if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });

      try {
        // Determine what to build
        let texFile = MAIN_TEX;
        let jobName = "quantum-observable-universe";

        if (scope === "chapter" && target) {
          // Build a standalone chapter
          const chapterTex = join(CHAPTERS_DIR, `${target}.tex`);
          if (!existsSync(chapterTex)) {
            return {
              content: [{ type: "text" as const, text: `Error: chapter file not found: ${chapterTex}` }],
            };
          }
          // Create a minimal wrapper that includes just this chapter
          const wrapper = `\\documentclass{article}
\\input{${join(REPO_ROOT, "preamble")}}
\\begin{document}
\\input{${chapterTex}}
\\end{document}`;
          const wrapperPath = join(BUILD_DIR, `chapter-${target}.tex`);
          writeFileSync(wrapperPath, wrapper);
          texFile = wrapperPath;
          jobName = `chapter-${target}`;
        }

        // Write print-mode preamble (formal mode enables affiliations)
        if (print_mode === "formal") {
          writeFileSync(
            join(REPO_ROOT, "print-mode.tex"),
            "\\showaffiliationstrue\n",
          );
        } else {
          writeFileSync(
            join(REPO_ROOT, "print-mode.tex"),
            "% compact mode — affiliations disabled\n",
          );
        }

        // Clean if requested
        if (clean) {
          spawnSync("latexmk", ["-C"], { cwd: REPO_ROOT, stdio: "pipe" });
        }

        // Run latexmk
        const engineFlag = engine === "pdflatex" ? "-pdf"
          : engine === "lualatex" ? "-lualatex"
          : "-xelatex";

        const result = spawnSync("latexmk", [
          engineFlag,
          `-jobname=${jobName}`,
          `-output-directory=${BUILD_DIR}`,
          "-interaction=nonstopmode",
          "-halt-on-error",
          "-file-line-error",
          texFile,
        ], {
          cwd: REPO_ROOT,
          stdio: "pipe",
          timeout: 300_000, // 5 min
        });

        const pdfPath = join(BUILD_DIR, `${jobName}.pdf`);
        const log = result.stderr?.toString().slice(-2000) || "";

        if (result.status === 0 && existsSync(pdfPath)) {
          return {
            content: [{
              type: "text" as const,
              text: `PDF rendered successfully: ${pdfPath}\n` +
                `Size: ${(readFileSync(pdfPath).length / 1024).toFixed(0)} KB`,
            }],
          };
        } else {
          return {
            content: [{
              type: "text" as const,
              text: `LaTeX compilation failed (exit ${result.status}).\n\nLast 2000 chars of log:\n${log}`,
            }],
          };
        }
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Render error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── paper_render_html ────────────────────────────────────────

  server.tool(
    "paper_render_html",
    "Render the paper (or chapter) to HTML using pandoc with KaTeX math. " +
    "Returns the path to the generated HTML file.",
    {
      scope: z.enum(["full", "chapter"]).default("full")
        .describe("What to render"),
      target: z.string().optional()
        .describe("Chapter identifier (required if scope=chapter)"),
      math_renderer: z.enum(["katex", "mathjax"]).default("katex")
        .describe("Math rendering engine for HTML output"),
    },
    async ({ scope, target, math_renderer }) => {
      if (!hasCommand("pandoc")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: pandoc not installed. Run: ./scripts/mcp-server/install.sh\n" +
              "Or install: apt install pandoc (Ubuntu) / port install pandoc (macOS)",
          }],
        };
      }

      if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });

      try {
        let inputFile = MAIN_TEX;
        let outputName = "quantum-observable-universe";

        if (scope === "chapter" && target) {
          const chapterTex = join(CHAPTERS_DIR, `${target}.tex`);
          if (!existsSync(chapterTex)) {
            return {
              content: [{ type: "text" as const, text: `Error: chapter not found: ${chapterTex}` }],
            };
          }
          inputFile = chapterTex;
          outputName = `chapter-${target}`;
        }

        const outputPath = join(BUILD_DIR, `${outputName}.html`);
        const mathFlag = math_renderer === "katex" ? "--katex" : "--mathjax";

        const result = spawnSync("pandoc", [
          inputFile,
          "-o", outputPath,
          "--standalone",
          mathFlag,
          "--toc",
          "--number-sections",
          `--metadata=title:Quantum Observable Universe`,
        ], {
          cwd: REPO_ROOT,
          stdio: "pipe",
          timeout: 120_000,
        });

        if (result.status === 0 && existsSync(outputPath)) {
          return {
            content: [{
              type: "text" as const,
              text: `HTML rendered: ${outputPath}\n` +
                `Size: ${(readFileSync(outputPath).length / 1024).toFixed(0)} KB\n` +
                `Math: ${math_renderer}`,
            }],
          };
        } else {
          const err = result.stderr?.toString().slice(-1000) || "unknown error";
          return {
            content: [{ type: "text" as const, text: `Pandoc failed (exit ${result.status}):\n${err}` }],
          };
        }
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Render error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── formula_render ───────────────────────────────────────────

  server.tool(
    "formula_render",
    "Quick-render a single LaTeX formula or tikzcd diagram to PNG. " +
    "Useful for previewing complex math before committing.",
    {
      latex: z.string().describe("LaTeX code (math mode content or full environment)"),
      display_math: z.boolean().default(true)
        .describe("Wrap in display math mode (\\[...\\]) if true"),
      packages: z.array(z.string()).default(["amsmath", "amssymb", "tikz-cd"])
        .describe("Additional LaTeX packages to load"),
      dpi: z.number().default(300)
        .describe("Output resolution in DPI"),
    },
    async ({ latex, display_math, packages, dpi }) => {
      if (!hasCommand("pdflatex")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: pdflatex not installed. Run: ./scripts/mcp-server/install.sh",
          }],
        };
      }

      if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });

      try {
        const usePackages = packages.map(p => `\\usepackage{${p}}`).join("\n");
        const body = display_math ? `\\[${latex}\\]` : latex;

        const doc = `\\documentclass[preview,border=2pt]{standalone}
${usePackages}
\\begin{document}
${body}
\\end{document}`;

        const tmpTex = join(BUILD_DIR, "formula-preview.tex");
        const tmpPdf = join(BUILD_DIR, "formula-preview.pdf");
        const tmpPng = join(BUILD_DIR, "formula-preview.png");

        writeFileSync(tmpTex, doc);

        // Compile to PDF
        const pdfResult = spawnSync("pdflatex", [
          "-interaction=nonstopmode",
          "-halt-on-error",
          `-output-directory=${BUILD_DIR}`,
          tmpTex,
        ], { cwd: BUILD_DIR, stdio: "pipe", timeout: 30_000 });

        if (pdfResult.status !== 0) {
          const log = pdfResult.stdout?.toString().slice(-1000) || "";
          return {
            content: [{ type: "text" as const, text: `Formula compilation failed:\n${log}` }],
          };
        }

        // Convert PDF → PNG (if pdftoppm or convert available)
        if (hasCommand("pdftoppm")) {
          spawnSync("pdftoppm", [
            `-r`, String(dpi), "-png", "-singlefile",
            tmpPdf, join(BUILD_DIR, "formula-preview"),
          ], { stdio: "pipe" });
        } else if (hasCommand("convert")) {
          spawnSync("convert", [
            "-density", String(dpi), tmpPdf, tmpPng,
          ], { stdio: "pipe" });
        }

        const outputFile = existsSync(tmpPng) ? tmpPng : tmpPdf;
        const outputType = existsSync(tmpPng) ? "PNG" : "PDF";

        return {
          content: [{
            type: "text" as const,
            text: `Formula rendered (${outputType}): ${outputFile}\n` +
              `Size: ${(readFileSync(outputFile).length / 1024).toFixed(1)} KB`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Formula render error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );
}
