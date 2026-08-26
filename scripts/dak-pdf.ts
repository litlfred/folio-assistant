#!/usr/bin/env bun
/**
 * DAK → PDF, first cut.
 *
 * §12.15 of `docs/proposals/rag-document-ingestion.md` states the target: the
 * content block is the source, and rendering fans out to a FHIR IG, some
 * Excels, and a PDF. §12.16 established that the PDF renderer **exists
 * nowhere** — `smart-base`'s only PDF dependency is `pdfplumber`, used to
 * *read* PDFs when extracting personas. This is the first thing that produces
 * one.
 *
 * ## What it does, and what it does not
 *
 * It assembles a DAK's narrative (`input/pagecontent/*.md`), an index of its
 * business processes, and its decision logic where DMN exists, into one HTML
 * document, and prints that to PDF with the Chromium already installed for
 * Playwright.
 *
 * It does **not** yet render:
 *
 * - **BPMN diagrams.** The processes are listed, not drawn. Drawing them needs
 *   either a BPMN layout renderer or pre-exported SVG, and `smart-dak-immz`
 *   ships neither (`input/images/` is empty).
 * - **Excel tables.** The data dictionary, indicators and requirements live in
 *   workbooks; rendering them means reading `.xlsx`, which is a separate
 *   dependency and a separate decision about which sheets belong in the PDF.
 * - **Content blocks.** The target is block → PDF. This renders the *current*
 *   hand-authored narrative, because that is what exists. When DAK blocks are
 *   authored, this is where they replace `pagecontent/`.
 *
 * Every omission is reported in the run summary rather than left implicit: a
 * PDF that silently drops the decision tables looks complete and is not.
 *
 * Usage:
 *   bun run scripts/dak-pdf.ts <dak-repo> -o out.pdf
 *   bun run scripts/dak-pdf.ts <dak-repo> --html-only -o out.html
 *
 * @module scripts/dak-pdf
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { basename, join } from "path";
import { remark } from "remark";
import remarkHtml from "remark-html";

interface Section {
  title: string;
  html: string;
  source: string;
}

interface Assembly {
  title: string;
  sections: Section[];
  /** Things a complete DAK PDF would contain and this one does not. */
  omissions: string[];
}

function mdToHtml(md: string): string {
  return String(remark().use(remarkHtml, { sanitize: false }).processSync(md));
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Title from sushi-config.yaml, falling back to the directory name. */
function dakTitle(root: string): string {
  const cfg = join(root, "sushi-config.yaml");
  if (existsSync(cfg)) {
    const m = readFileSync(cfg, "utf-8").match(/^title:\s*(.+)$/m);
    if (m) return m[1]!.trim().replace(/^["']|["']$/g, "");
  }
  return basename(root);
}

export function assemble(root: string): Assembly {
  const sections: Section[] = [];
  const omissions: string[] = [];

  // 1. Narrative.
  const pageDir = join(root, "input", "pagecontent");
  if (existsSync(pageDir)) {
    for (const f of readdirSync(pageDir).filter((f) => f.endsWith(".md")).sort()) {
      const md = readFileSync(join(pageDir, f), "utf-8");
      if (!md.trim()) continue;
      sections.push({
        title: basename(f, ".md").replace(/[-_]/g, " "),
        html: mdToHtml(md),
        source: `input/pagecontent/${f}`,
      });
    }
  } else {
    omissions.push("no input/pagecontent/ — the DAK has no narrative to render");
  }

  // 2. Business processes. Listed, not drawn — see the module docstring.
  const bpDir = join(root, "input", "business-processes");
  if (existsSync(bpDir)) {
    const files = readdirSync(bpDir).filter((f) => f.endsWith(".bpmn")).sort();
    if (files.length) {
      const items = files
        .map((f) => `<li><code>${esc(f)}</code></li>`)
        .join("\n");
      sections.push({
        title: "Business processes",
        html: `<ul>\n${items}\n</ul>`,
        source: "input/business-processes/",
      });
      omissions.push(
        `${files.length} BPMN process(es) listed but not drawn — no diagram renderer, and no pre-exported SVG in input/images/`,
      );
    }
  }

  // 3. Decision logic, where DMN exists at all.
  const dmn = findByExt(root, ".dmn");
  if (dmn.length) {
    sections.push({
      title: "Decision logic",
      html: `<ul>\n${dmn.map((f) => `<li><code>${esc(f)}</code></li>`).join("\n")}\n</ul>`,
      source: "*.dmn",
    });
    omissions.push(
      `${dmn.length} DMN file(s) listed but not rendered — run smart-base-transform.py dmn2html and inline the result`,
    );
  }

  // 4. The workbooks, which carry most of a DAK's substance.
  const xlsx = findByExt(root, ".xlsx");
  if (xlsx.length) {
    omissions.push(
      `${xlsx.length} workbook(s) not rendered (data dictionary, indicators, requirements) — needs an .xlsx reader and a decision about which sheets belong in the PDF`,
    );
  }

  return { title: dakTitle(root), sections, omissions };
}

function findByExt(root: string, ext: string, depth = 4): string[] {
  const out: string[] = [];
  (function walk(dir: string, d: number) {
    if (d > depth) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || e === "node_modules") continue;
      const p = join(dir, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p, d + 1);
      else if (e.endsWith(ext)) out.push(p.slice(root.length + 1));
    }
  })(root, 0);
  return out.sort();
}

export function toHtml(a: Assembly): string {
  const toc = a.sections
    .map((s, i) => `<li><a href="#s${i}">${esc(s.title)}</a></li>`)
    .join("\n");
  const body = a.sections
    .map(
      (s, i) =>
        `<section id="s${i}"><h1>${esc(s.title)}</h1>\n${s.html}\n` +
        `<p class="src">source: ${esc(s.source)}</p></section>`,
    )
    .join("\n");

  // The omissions are printed *in the document*, not only in the run log. A
  // PDF that silently drops the decision tables looks complete and is not, and
  // whoever reads the PDF is the one who needs to know.
  const gaps = a.omissions.length
    ? `<section class="gaps"><h1>Not included in this rendering</h1><ul>${a.omissions
        .map((o) => `<li>${esc(o)}</li>`)
        .join("")}</ul></section>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(a.title)}</title>
<style>
  body { font: 11pt/1.5 Georgia, serif; margin: 0; color: #111; }
  section { padding: 0 2.2cm; page-break-before: always; }
  section:first-of-type { page-break-before: avoid; }
  h1 { font-size: 18pt; border-bottom: 1px solid #ccc; padding-bottom: .2em; }
  h2 { font-size: 14pt; } h3 { font-size: 12pt; }
  code { font: 10pt monospace; background: #f4f4f4; padding: .1em .3em; }
  pre { background: #f4f4f4; padding: .6em; overflow-x: auto; }
  table { border-collapse: collapse; } td, th { border: 1px solid #bbb; padding: .3em .5em; }
  .cover { padding: 6cm 2.2cm 0; page-break-after: always; }
  .cover h1 { font-size: 26pt; border: 0; }
  .src { color: #777; font-size: 8pt; font-style: italic; }
  .gaps { background: #fff8e1; }
  .gaps li { margin: .3em 0; }
</style></head><body>
<div class="cover"><h1>${esc(a.title)}</h1><p>Digital Adaptation Kit — rendered by folio-assistant</p></div>
<section id="toc"><h1>Contents</h1><ol>${toc}</ol></section>
${body}
${gaps}
</body></html>`;
}

/**
 * Chromium's location, when the bundled download is not what is installed.
 *
 * This container ships Chromium under `PLAYWRIGHT_BROWSERS_PATH` at a
 * different build number than the installed `playwright` expects, so the
 * default launch looks for `chromium_headless_shell-1228` and finds `-1194`.
 * Probing for the real binary is what makes this work without re-downloading a
 * browser, which the environment deliberately blocks.
 */
function chromiumExecutable(): string | undefined {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  for (const dir of readdirSync(base).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell", "chrome-linux64/chrome"]) {
      const p = join(base, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

async function renderPdf(html: string, out: string): Promise<void> {
  const { chromium } = await import("playwright");
  const executablePath = chromiumExecutable();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
  );
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({
      path: out,
      format: "A4",
      margin: { top: "1.6cm", bottom: "1.6cm", left: "0", right: "0" },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const root = argv.find((a) => !a.startsWith("-"));
  const outIdx = argv.findIndex((a) => a === "-o" || a === "--out");
  const out = outIdx >= 0 ? argv[outIdx + 1] : undefined;
  const htmlOnly = argv.includes("--html-only");

  if (!root || !out) {
    console.error("usage: dak-pdf.ts <dak-repo> -o <out.pdf> [--html-only]");
    return 2;
  }
  if (!existsSync(root)) {
    console.error(`no such directory: ${root}`);
    return 2;
  }

  const a = assemble(root);
  if (a.sections.length === 0) {
    console.error(`nothing to render under ${root} — not a DAK repository?`);
    return 1;
  }
  const html = toHtml(a);

  if (htmlOnly) {
    writeFileSync(out, html);
  } else {
    try {
      await renderPdf(html, out);
    } catch (e) {
      console.error(`PDF rendering failed (${String(e).slice(0, 140)})`);
      console.error("Chromium is required. Re-run with --html-only to get the assembled HTML.");
      return 3;
    }
  }

  console.log(`${a.title}\n  ${a.sections.length} section(s) → ${out}`);
  if (a.omissions.length) {
    console.log(`\n  not included (${a.omissions.length}):`);
    for (const o of a.omissions) console.log(`    - ${o}`);
  }
  return 0;
}

if (import.meta.main) {
  main()
    .then((c) => process.exit(c))
    .catch((e) => {
      console.error(e);
      process.exit(2);
    });
}
