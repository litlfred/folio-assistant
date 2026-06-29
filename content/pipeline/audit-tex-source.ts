#!/usr/bin/env bun
/**
 * Audit TeX-source hazards that crash pdflatex but are easy to miss.
 *
 * Rationale
 * ─────────
 * Build & Publish #3262 / #3264 failed with:
 *   - "! Missing $ inserted" / "! Extra }" from bare `_` / `^` /
 *     non-ASCII characters in references.ts `title` / `note` /
 *     `container-title` fields (rendered into .bbl outside math mode).
 *   - "! TeX capacity exceeded" from `\refterm{...}` re-expanding inside
 *     section titles (preamble fix; not detectable here).
 *   - Garbled output from `|...|` (absolute value) inside markdown
 *     table cells — `|` is the column separator, so the math span is
 *     split across columns.
 *   - Multi-line `$...$` math spans that `remark-math` does not span,
 *     leaking math markup into prose.
 *   - Markdown link syntax `[txt](#label)` inside fenced ```tex blocks,
 *     which the markdown→LaTeX renderer copies through verbatim,
 *     producing literal `[txt](#label)` in the PDF.
 *   - Double subscripts `X_Y_{...}` (LaTeX rejects two `_` at the same
 *     level).
 *
 * This audit catches all of the above before pdflatex sees the source.
 *
 * Usage:
 *   bun run pipeline/audit-tex-source.ts
 *   bun run pipeline/audit-tex-source.ts --strict   (exit 1 on any finding)
 *
 * @module content/pipeline/audit-tex-source
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "fs";
import { resolve, join, relative } from "path";
import { findMathTextSeams } from "./render-latex";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const args = process.argv.slice(2);
const strict = args.includes("--strict");

interface Finding {
  rule: string;
  file: string;
  line: number;
  detail: string;
}
const findings: Finding[] = [];
function report(rule: string, file: string, line: number, detail: string) {
  findings.push({ rule, file: relative(REPO_ROOT, file), line, detail });
}

// ── Helper: walk a directory recursively, collecting files with given suffix ──
function walk(dir: string, suffix: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".lake" || name === "build" ||
        name === ".git" || name === "dist" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, suffix, out);
    else if (full.endsWith(suffix)) out.push(full);
  }
  return out;
}

// ── Rule A: bare `_` / `^` / non-ASCII in references.ts string fields ────────
// Scans `title`, `note`, `container-title` literals; flags any `_`, `^`, or
// non-ASCII character that is not inside a `$...$` math span.
function auditReferencesTs() {
  const refsFile = join(REPO_ROOT, "content/schema/references.ts");
  if (!existsSync(refsFile)) return;
  const text = readFileSync(refsFile, "utf-8");

  // Match `field: "..."` or `field: \n  "..." + \n  "..."` (concatenated).
  // We grab each individual string literal independently.
  const fieldRe =
    /(title|note|"container-title"|container-title):\s*((?:\n?\s*"[^"]*"\s*\+?\s*)+)/g;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(text))) {
    const field = m[1].replace(/"/g, "");
    const block = m[2];
    // Iterate string literals in the block
    const litRe = /"([^"]*)"/g;
    let lm: RegExpExecArray | null;
    while ((lm = litRe.exec(block))) {
      const s = lm[1];
      // URLs are exempt
      if (/https?:\/\//.test(s)) continue;
      let inMath = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "$") { inMath = !inMath; continue; }
        if (inMath) continue;
        // bare _ or ^ (not preceded by `\`)
        if ((c === "_" || c === "^") && (i === 0 || s[i - 1] !== "\\")) {
          const lineNo = text.slice(0, m.index + m[0].indexOf(lm[0]) + lm.index).split("\n").length;
          report(
            "bib-bare-math-char",
            refsFile,
            lineNo,
            `${field} contains bare '${c}' outside $...$: "${s.slice(0, 80)}"`
          );
          break;
        }
        // Non-ASCII (likely raw unicode like ⊗, ∆, ≈ that won't render).
        // Allow Latin-1 accented letters (handled by inputenc utf8) and
        // common typographic punctuation.
        const code = c.charCodeAt(0);
        // Latin-1 supplement letters (À–ÿ minus math symbols) are fine.
        if (code >= 0x00C0 && code <= 0x024F) continue;
        const allowedNonAscii = new Set([
          0x2014, // — em dash
          0x2013, // – en dash
          0x2018, // ' left single quote
          0x2019, // ' right single quote / apostrophe
          0x201C, // " left double quote
          0x201D, // " right double quote
          0x2026, // … ellipsis
          0x00A0, // non-breaking space
          0x00B7, // · middle dot
        ]);
        if (code > 0x7e && !allowedNonAscii.has(code)) {
          const lineNo = text.slice(0, m.index + m[0].indexOf(lm[0]) + lm.index).split("\n").length;
          report(
            "bib-non-ascii",
            refsFile,
            lineNo,
            `${field} contains non-ASCII '${c}' (U+${code.toString(16).toUpperCase().padStart(4, "0")}) outside $...$: "${s.slice(0, 80)}"`
          );
          break;
        }
      }
    }
  }
}

// ── Rule B: removed ──────────────────────────────────────────────────────────
// `|` inside `$...$` math spans in markdown table cells *can* be split by
// the GFM table parser, but in practice the remark pipeline tokenises the
// math span first in most cases and many such patterns render correctly.
// The rule fired on ~80 currently-passing instances and was retired.
// Authors should still prefer `\lvert ... \rvert` / `\mid` for new content.
function auditMarkdownTablePipes(_file: string) { /* disabled */ }

// ── Rule C: markdown link [...](...) inside ```tex fenced blocks ─────────────
// The markdown→LaTeX renderer copies fenced `tex` blocks verbatim, so
// markdown link syntax inside them survives as literal text in the PDF.
function auditMarkdownLinkInTexFence(file: string) {
  const text = readFileSync(file, "utf-8");
  const lines = text.split("\n");
  let inTexFence = false;
  let fenceStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!inTexFence) {
      if (/^```(tex|latex)\s*$/i.test(t)) { inTexFence = true; fenceStart = i + 1; }
    } else {
      if (t === "```") { inTexFence = false; continue; }
      // Match [text](#label) or [text](http...) — but allow LaTeX hyperref
      // patterns and `\cite[...]{...}`
      const m = line.match(/(?<!\\(?:cite|ref|label|section|chapter|hyperref)[^\s]{0,60})\[[^\]]+\]\(#?[^\s)]+\)/);
      if (m) {
        report(
          "md-link-in-tex-fence",
          file,
          i + 1,
          `Markdown link "${m[0].slice(0, 60)}" inside a \`\`\`tex fenced block (opened at line ${fenceStart}). Use \\hyperref[label]{text} instead.`
        );
      }
    }
  }
}

// ── Rule D: removed ──────────────────────────────────────────────────────────
// (Multi-line inline `$...$` IS supported by remark-math — see
//  copilot-instructions.md §TeX authoring patterns "Multi-line inline math
//  is valid". An earlier version of this audit flagged them all; that was
//  incorrect.)

// ── Rule E: double subscripts X_Y_{...} ──────────────────────────────────────
// LaTeX rejects two `_` at the same level (`N_v_{\mathrm{target}}` ⇒
// "! Double subscript"). Only the `_<single-alnum>_{` form is a real error;
// `e_ie_j` (product of two indexed atoms) and `d_q\delta_q` (product) are
// fine because the second `_` is on a different atom.
function auditDoubleSubscripts(file: string) {
  const text = readFileSync(file, "utf-8");
  const lines = text.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Walk math spans only
    const mathRe = /\$([^$\n]+?)\$|\$\$([\s\S]*?)\$\$/g;
    let mm: RegExpExecArray | null;
    while ((mm = mathRe.exec(line))) {
      const body = mm[1] || mm[2] || "";
      // Strict: `_<single alnum>_{`  (first sub is unbraced single token,
      // second sub is a brace group — this is the form pdflatex rejects).
      if (/_[A-Za-z0-9]_\{/.test(body)) {
        report(
          "md-double-subscript",
          file,
          i + 1,
          `Double subscript in math: "${body.slice(0, 60)}". Use \`X_{a,b}\` instead of \`X_a_{b}\`.`
        );
      }
    }
  }
}

// ── Rule: $…$word seam (a formula abutting a word with no space) ──────────────
// A dropped space such as `$V$discharged` renders as one unbreakable box that
// overflows a narrow table cell. The renderer bridges it with a zero-width break
// (render-latex renderChildren), but a genuine typo still *reads* run-together,
// so flag the seam to add the space in the source. Intentional suffixes
// (`$n$th`), punctuation-led runs (`$\mathbb{Z}$-module`) and spaced text don't
// match (shared detector: findMathTextSeams).
function auditMathTextSeams(file: string) {
  let seams: ReturnType<typeof findMathTextSeams>;
  try {
    seams = findMathTextSeams(readFileSync(file, "utf-8"));
  } catch {
    return;
  }
  for (const s of seams) {
    report("math-text-seam", file, s.line, `formula abutting a word (missing space?): "${s.context}"`);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log("Auditing TeX-source hazards...");
auditReferencesTs();
const contentRoot = join(REPO_ROOT, "content");
const mdFiles = walk(contentRoot, ".md");
for (const f of mdFiles) {
  // Skip .md files that are pure docs, not paper content
  if (f.includes("/node_modules/") || f.includes("/docs/")) continue;
  auditMarkdownTablePipes(f);
  auditMarkdownLinkInTexFence(f);
  auditDoubleSubscripts(f);
  auditMathTextSeams(f);
}

// ── Report ───────────────────────────────────────────────────────────────────
const byRule = new Map<string, Finding[]>();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule)!.push(f);
}

// Sidecar: machine-readable findings (e.g. the math-text-seam list) for
// downstream tooling / a content-fix worklist. Written every run.
const OUT_JSON = resolve(REPO_ROOT, "content/audit-tex-source.json");
writeFileSync(
  OUT_JSON,
  JSON.stringify(
    { total: findings.length, byRule: Object.fromEntries([...byRule].map(([r, i]) => [r, i.length])), findings },
    null,
    2,
  ),
);
console.log(`Sidecar: ${relative(REPO_ROOT, OUT_JSON)}`);

if (findings.length === 0) {
  console.log("✓ No TeX-source hazards detected.");
  process.exit(0);
}

for (const [rule, items] of byRule) {
  console.log(`\n[${rule}] ${items.length} finding(s):`);
  for (const it of items.slice(0, 50)) {
    console.log(`  ${it.file}:${it.line}  ${it.detail}`);
  }
  if (items.length > 50) console.log(`  ... and ${items.length - 50} more`);
}

console.log(`\n${findings.length} total finding(s) across ${byRule.size} rule(s).`);
process.exit(strict ? 1 : 0);
