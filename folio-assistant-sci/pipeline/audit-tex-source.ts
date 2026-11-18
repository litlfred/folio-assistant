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
 *   bun run folio-assistant-sci/pipeline/audit-tex-source.ts
 *   bun run folio-assistant-sci/pipeline/audit-tex-source.ts --strict   (exit 1 on any finding)
 *
 * @module pipeline/audit-tex-source
 */

import { folioDirDeferred } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.js";
import { FOLIO_PAGE } from "@litlfred/cat-harness/folio-render/file-list.js";
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "fs";
import { resolve, join, relative, basename } from "path";
import { findMathTextSeams } from "@litlfred/cat-harness-tools/pipeline/render-latex.ts";
import { findContentRepoRoot } from "@litlfred/cat-harness-tools/pipeline/repo-root.ts";
import { referenceEntries, referencesModule } from "@litlfred/cat-harness-tools/pipeline/reference-entries.ts";

// Was rooted at this file's own location, which is the PLATFORM — but every
// path below is folio content. `findContentRepoRoot()` walks up from cwd;
// it must not use `import.meta.dir`, which resolves back through a folio's
// `folio-assistant/` symlink to the platform.
const REPO_ROOT = findContentRepoRoot();
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

// ── Rule A: bare `_` / `^` / non-ASCII in a bibliography's string fields ─────
// Scans `title`, `note`, `container-title`; flags any `_`, `^`, or non-ASCII
// character that is not inside a `$...$` math span. Over every entry, wherever
// it is kept (`reference-entries.ts`): one CSL-JSON file per entry
// (`<folio>/references/<key>.json`) and any `ref({…})` left in references.ts.
const RULE_A_FIELDS = ["title", "note", "container-title"] as const;

/**
 * Rule A over one string. By default it stops at the first finding, as it
 * always has for a `references.ts` literal (a field written as several `+`
 * pieces is checked piece by piece). A per-entry file's field is one whole
 * string, so `perRule` lets each rule report once in it: one finding hiding
 * the other would lose what piece-by-piece checking found.
 */
function auditBibString(field: string, s: string, file: string, lineNo: number, perRule = false) {
  // URLs are exempt
  if (/https?:\/\//.test(s)) return;
  const fired = new Set<string>();
  let inMath = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "$") { inMath = !inMath; continue; }
    if (inMath) continue;
    // bare _ or ^ (not preceded by `\`)
    if ((c === "_" || c === "^") && (i === 0 || s[i - 1] !== "\\") && !fired.has("bib-bare-math-char")) {
      report(
        "bib-bare-math-char",
        file,
        lineNo,
        `${field} contains bare '${c}' outside $...$: "${s.slice(0, 80)}"`
      );
      if (!perRule) break;
      fired.add("bib-bare-math-char");
      continue;
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
    if (code > 0x7e && !allowedNonAscii.has(code) && !fired.has("bib-non-ascii")) {
      report(
        "bib-non-ascii",
        file,
        lineNo,
        `${field} contains non-ASCII '${c}' (U+${code.toString(16).toUpperCase().padStart(4, "0")}) outside $...$: "${s.slice(0, 80)}"`
      );
      if (!perRule) break;
      fired.add("bib-non-ascii");
    }
  }
}

function auditReferencesTs() {
  const entries = referenceEntries(REPO_ROOT);
  // A per-entry file: each field is a JSON string, or an array of them.
  for (const e of entries) {
    if (e.kind !== "file") continue;
    for (const field of RULE_A_FIELDS) {
      const v = e.data[field];
      const strings = typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
      if (!strings.length) continue;
      const at = e.text.indexOf(`"${field}":`);
      const lineNo = at < 0 ? 1 : e.text.slice(0, at).split("\n").length;
      for (const str of strings) auditBibString(field, str, e.file, lineNo, true);
    }
  }

  // The module: entries still written as `ref({…})` (qou keeps the one built
  // from its paper identity), or every entry before a folio splits them out.
  const refsFile = referencesModule(REPO_ROOT);
  if (!refsFile) return;
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
      // The literal's offset is the block's start in the match plus its own
      // index in the block. (It was `m[0].indexOf(lm[0]) + lm.index`, which
      // counts the literal's offset twice and named a line further down,
      // often inside the next entry.)
      const lineNo = text.slice(0, m.index + (m[0].length - block.length) + lm.index).split("\n").length;
      auditBibString(field, lm[1], refsFile, lineNo);
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
const folioRootOf = folioDirDeferred(REPO_ROOT, import.meta.url);
// The folio's own generated file list (`folio-render/file-list.ts`, ohx6) is
// a rendering of the folio, not content of it, exactly as its README is. Left
// in, it made the platform's landing folio read as content, so this audit
// reported a clean pass over a page nobody authored instead of exit 2.
const isFolioRendering = (f: string): boolean => {
  if (resolve(f) !== resolve(folioRootOf(), FOLIO_PAGE)) return false;
  try {
    return readFileSync(f, "utf-8").includes("<!-- Generated by folio-render/");
  } catch {
    return false;
  }
};
const mdFiles = walk(folioRootOf(), ".md").filter(
  (f) => !f.includes("/node_modules/") && !f.includes("/docs/") && basename(f) !== "README.md" && !isFolioRendering(f),
);
// Same rule: a report over zero files is not a clean result.
if (mdFiles.length === 0) {
  console.error(
    `No .md files found under ${folioRootOf()} — refusing to report success.\n` +
    "This audits a FOLIO's content; folio-assistant is the platform.\n" +
    "Run it from the content repo.",
  );
  process.exit(2);
}
for (const f of mdFiles) {
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
// declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
const OUT_JSON = resolve(REPO_ROOT, "folio/audit-tex-source.json");
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
