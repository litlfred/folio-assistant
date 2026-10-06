#!/usr/bin/env bun
/**
 * build-document-site — a DOCUMENT folio rendered as a browsable site, for
 * staging previews and the review page. Bean `fyu2`, epic `q4jm`.
 *
 * ## Why this exists
 *
 * `folio-staging.yml` (bean `ojcx`) publishes whatever a folio's
 * `build_command` writes, and the platform had no command a document folio
 * could name. `publish.yml` builds a PAPER, through LaTeX. The document
 * adapter's `document_render_html` MCP tool renders one document to HTML, but
 * only as a tool call, through pandoc, into a build directory. A CI job wants a
 * command, a site directory, and no system install.
 *
 * So this reuses the adapter's own assembly, `buildDocumentMarkdown`, which
 * already emits `<a id="<label>">` before every labelled block, section and
 * chapter. Those anchors are what the review page and the ChangeSet link to.
 * It renders with `remark-html`, already a dependency, so no pandoc is
 * needed, and with `remark-gfm`, so a block's Markdown table is a `<table>`
 * rather than a paragraph of raw pipes (bean fz39, the owner's approval
 * 2026-09-23).
 *
 * ## Output
 *
 *   <out>/index.html          every document in the folio, linked
 *   <out>/<slug>/index.html   one page per document, block anchors intact
 *   <out>/<slug>/media/       the document's images, copied from folio/<slug>/media/
 *   <out>/review/index.html   what changed from main, read from the preview's
 *                             changeset.json when opened (bean txut)
 *   <out>/outline.json        every document's chapters, sections and blocks
 *                             in manifest order, for the review page's
 *                             outline and minimap (bean eb4l)
 *
 * ## The outline's section keys are the ChangeSet's
 *
 * `folio-assistant-core/schemas/changeset.ts` names a section
 * `<manifest dir, relative to the folio>::<label ?? title>`, from the text of
 * the manifest. The outline writes exactly that key, so the review page can
 * join the two without guessing, and a test holds them equal on a real folio.
 * A section REFERENCE (its own `.ts`) is skipped here, as the Markdown build
 * skips it.
 *
 * ## Failure is loud
 *
 * A folio with no document, or a document whose assembly reports an error,
 * exits non-zero. A site that silently omitted a document would be a preview
 * that reads "that document was deleted" to a reviewer.
 *
 * Raw HTML in the assembled Markdown is kept (`sanitize: false`), because the
 * block anchors ARE raw HTML. The content is the folio's own, published by
 * the folio's own workflow, which is the same trust the build command already
 * has.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { remark } from "remark";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

import { folioDir } from "../../cat-harness/schemas/cat-harness.js";
import { readHarnessConfig } from "../../cat-harness/schemas/harness-config.js";
import { detectRepoUrl, ownerRepo } from "../../cat-harness/src/core/git-refs.js";
import { DEFAULT_TEMPLATE, injectBlockActions, readIssueForm, type BlockActionsConfig, type BlockContext } from "./block-actions.js";
import type { Chapter, Paper, Section, SectionRef } from "../../cat-harness/schemas/types.js";
import { buildDocumentMarkdown } from "../../cat-harness/content/pipeline/render-markdown.js";
import { reviewPageHtml } from "../../cat-harness/scripts/gen-review-page.js";
import { darkRules } from "../../cat-harness/scripts/lib/scheme-css.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A readable page shell. Light and dark follow the reader's system setting. */
function page(title: string, body: string, math?: MathOptions, tail = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light dark; --fg: #1b1b1b; --bg: #fdfdfb; --muted: #5b5b5b; --link: #0b5cad; }
  ${darkRules(`:root { --fg: #e8e8e6; --bg: #161616; --muted: #a8a8a4; --link: #7db4ff; }`)}
  body { margin: 0; font: 1.05rem/1.6 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
  /* The column and its gutters belong to main, not body: the harness rail sets
     body padding-left to clear its strip, which replaced a body's own gutter and
     put the text flush against the rail (owner, 2026-10-05). No tag names in
     this comment: the rail injector finds the page's first body and main tags
     by text. */
  main { max-width: 46rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  a { color: var(--link); }
  a:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
  h1, h2, h3 { line-height: 1.25; }
  table { border-collapse: collapse; } th, td { border: 1px solid var(--muted); padding: .3rem .5rem; }
  :target { scroll-margin-top: 1rem; }
  .katex-display { overflow-x: auto; overflow-y: hidden; }
  dfn.defterm { font-style: normal; font-weight: 600; }
  .cite { color: var(--muted); }
  .fa-blk:empty { min-height: 3rem; }
  .fa-one-page { font-size: .85rem; color: var(--muted); }
</style>${math ? mathHead(math) : ""}
</head>
<body>
<main>
${body}
</main>${tail}
</body>
</html>
`;
}

// ── Lazy pages: the block text as data (bean v433, owner 2026-10-06) ────────
//
// *"that can be dynamic JS load of KG, as should of rest of content"*. A large
// document's page is a SHELL: every heading, every block anchor (so links, the
// review page, [edit]/[feedback] and the comment notes all still find their
// block) and an empty placeholder per block. Each block's rendered HTML is
// published as data, `<slug>/blocks/NNN.json`, in document order, a chunk of
// {@link LAZY_CHUNK} blocks each. The page loads the chunks near the reader,
// then the rest in idle time. `index.hydrated.html` is the whole document on one page,
// as before: a `file://` open (where fetch fails), a reader without
// JavaScript, and any tool that wants the text in the page all get that.
//
// Small documents stay one page: below {@link LAZY_THRESHOLD} blocks there is
// nothing to save, and one file is simpler to read and to test. Searching the
// comments is the dashboard's job (owner: "only the visualizer search for the
// PCs"), so nothing here needs the text in the page to be findable at once.

export const LAZY_THRESHOLD = 200;
export const LAZY_CHUNK = 40;

export interface BlockSplit {
  /** The document with each listed block's body replaced by a placeholder. */
  shell: string;
  /** Each listed block's Markdown, in document order. */
  blocks: { label: string; markdown: string }[];
}

/**
 * Split the assembled Markdown at block anchors. A block runs from its
 * `<a id="<label>"></a>` line to the next anchor or heading; lines inside a
 * fenced code block are never read as either. Anchors that are not block
 * labels (sections, chapters) stay in the shell, with their headings.
 */
export function splitBlocks(markdown: string, labels: Set<string>): BlockSplit {
  const ANCHOR = /^<a id="([^"]+)"><\/a>\s*$/;
  const HEADING = /^#{1,6}\s/;
  const FENCE = /^\s*(```|~~~)/;
  const shell: string[] = [];
  const blocks: BlockSplit["blocks"] = [];
  let cur: { label: string; lines: string[] } | null = null;
  let inFence = false;
  const close = () => {
    if (cur) blocks.push({ label: cur.label, markdown: cur.lines.join("\n").trim() + "\n" });
    cur = null;
  };
  for (const line of markdown.split("\n")) {
    if (!inFence) {
      const m = line.match(ANCHOR);
      if (m) {
        close();
        shell.push(line);
        if (labels.has(m[1]!)) {
          shell.push("", `<div class="fa-blk" data-blk="${esc(m[1]!)}"></div>`, "");
          cur = { label: m[1]!, lines: [] };
        }
        continue;
      }
      if (HEADING.test(line)) {
        close();
        shell.push(line);
        continue;
      }
    }
    if (FENCE.test(line)) inFence = !inFence;
    if (cur) cur.lines.push(line);
    else shell.push(line);
  }
  close();
  return { shell: shell.join("\n"), blocks };
}

/** Every `id="…"` in a block's HTML, so a link to a term inside an unloaded block finds its chunk. */
const idsIn = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);

/** The loader a lazy page runs. Index: label and inner id -> chunk number. */
function lazyLoader(index: { chunks: number; of: Record<string, number>; ids: Record<string, number> }): string {
  const json = JSON.stringify(index).replace(/</g, "\\u003c");
  return `
<script type="application/json" id="fa-blocks">${json}</script>
<script>
(() => {
  const ix = JSON.parse(document.getElementById("fa-blocks").textContent);
  const pending = new Map();
  let failed = false;
  const fill = (data) => {
    for (const [label, html] of Object.entries(data)) {
      const ph = document.querySelector('.fa-blk[data-blk="' + CSS.escape(label) + '"]');
      if (!ph || ph.dataset.filled) continue;
      ph.innerHTML = html;
      ph.dataset.filled = "1";
      if (window.faMathObserve) window.faMathObserve(ph);
    }
  };
  // Fetch fails when the page is opened from disk: the whole document is one
  // page away, so go there rather than show empty blocks.
  const load = (n) => {
    if (!pending.has(n)) pending.set(n, fetch("blocks/" + String(n).padStart(3, "0") + ".json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(fill)
      .catch(() => { if (!failed) { failed = true; location.replace("index.hydrated.html" + location.search + location.hash); } }));
    return pending.get(n);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); load(ix.of[e.target.dataset.blk]); }
  }, { rootMargin: "2000px 0px" });
  for (const ph of document.querySelectorAll(".fa-blk")) io.observe(ph);
  // A link to a block, or to a term inside one, loads its chunk and lands on it.
  const go = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const n = id ? (ix.of[id] ?? ix.ids[id]) : undefined;
    if (n === undefined) return;
    load(n).then(() => document.getElementById(id)?.scrollIntoView());
  };
  addEventListener("hashchange", go);
  go();
  // Then the rest, one chunk at a time while the browser is idle, so the whole
  // text is there for reading on and for the browser's own find.
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  let next = 0;
  const more = () => { while (next < ix.chunks && pending.has(next)) next++; if (next < ix.chunks) load(next).then(() => idle(more)); };
  addEventListener("load", () => idle(more));
})();
</script>`;
}


// ── Math, glossary directives and citations (bean dsm1, owner 2026-10-05) ──
//
// A PAPER folio's blocks carry TeX: `$…$`, `$$…$$`, `:defterm[…]{#slug}` /
// `:refterm[…]{#slug}` and `\cite{key}`. Rendered as plain Markdown they reach
// a reader as raw source — and worse than raw, because Markdown reads `_` and
// `*` inside an equation as emphasis and corrupts it. So, when math is on:
//
// - `remark-math` claims the math BEFORE emphasis is parsed, and emits it as
//   `code.math-inline` / `pre > code.math-display`. KaTeX renders those in the
//   browser — the same KaTeX 0.16.11, from the same CDN, with the same
//   `\name -> tex` macro table, that the viewer already uses, built from the
//   paper manifest's `macros`.
// - Math is OPT-IN. A document folio writes "$5 million" in prose, and
//   `remark-math` would turn the text between two dollar signs into an
//   equation. It is on by default only for a `contentType: "paper"` instance;
//   `--math` / `--no-math` override.
//
// Directives and citations are handled whatever the content type, because
// they are unambiguous: a `:defterm` becomes a `dfn` with its slug as the id, a
// `:refterm` links to that id, and a directive of any OTHER name is put back
// as the text it was written as (prose like "note:x" must not vanish).
// `\cite{a,b}` becomes a muted `[a, b]` carrying the keys; linking it to a
// bibliography needs the folio's reference registry, which this command does
// not load.

export interface MathOptions {
  /** `\name` -> TeX, as KaTeX's `macros` option takes it. */
  macros: Record<string, string>;
}

const KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist";

function mathHead(math: MathOptions): string {
  const macros = JSON.stringify(math.macros).replace(/</g, "\\u003c");
  return `
<link rel="stylesheet" href="${KATEX}/katex.min.css">
<script defer src="${KATEX}/katex.min.js"></script>
<script>
addEventListener("DOMContentLoaded", () => {
  // Rendered as each equation nears the viewport, not all at once: a paper
  // page can hold ~80,000 equations, and rendering them up front measured 78 s
  // before the page was usable (qou, 2026-10-05).
  const macros = ${macros};
  const render = (el) => {
    const display = el.classList.contains("math-display");
    const out = document.createElement(display ? "div" : "span");
    try { katex.render(el.textContent, out, { throwOnError: false, displayMode: display, macros }); }
    catch { return; }
    const host = display && el.parentElement && el.parentElement.tagName === "PRE" ? el.parentElement : el;
    host.replaceWith(out);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); render(e.target); }
  }, { rootMargin: "1500px 0px" });
  // Blocks a lazy page loads later call this on what they add (bean v433).
  window.faMathObserve = (root) => { for (const el of root.querySelectorAll("code.math-inline, code.math-display")) io.observe(el); };
  window.faMathObserve(document);
});
</script>`;
}

/** The viewer's macro table (`buildKatexMacros` in cat-harness/viewer/index.html), from a paper manifest. */
export function katexMacros(paperMacros: Record<string, { tex: string }> | undefined): Record<string, string> {
  const m: Record<string, string> = { "\\bigbowtie": "\\bowtie", "\\smallmatrix": "\\begin{smallmatrix}", "\\qed": "\\square" };
  for (const [name, def] of Object.entries(paperMacros ?? {})) m["\\" + name] = def.tex;
  return m;
}

/** `\cite{a,b}` -> a muted `[a, b]`, outside fenced code. */
export function citationsToHtml(markdown: string): string {
  // Per fenced/unfenced run rather than per line: a `\cite{a,\n b}` wrapped by
  // the author's line breaks is one citation (qou notation-collisions, found
  // by the rendered-content QA as visible raw TeX).
  const runs: { lines: string[]; fenced: boolean }[] = [];
  let run = { lines: [] as string[], fenced: false };
  for (const line of markdown.split("\n")) {
    const fence = /^\s*(```|~~~)/.test(line);
    if (fence && !run.fenced) {
      runs.push(run);
      run = { lines: [line], fenced: true };
    } else if (fence) {
      run.lines.push(line);
      runs.push(run);
      run = { lines: [], fenced: false };
    } else run.lines.push(line);
  }
  runs.push(run);
  return runs
    .filter((r) => r.lines.length > 0)
    .map((r) => (r.fenced ? r.lines.join("\n") : cite(r.lines.join("\n"))))
    .join("\n");

  function cite(text: string): string {
    return text.replace(/\\cite[pt]?\{([^}]+)\}/g, (_m, keys: string) => {
      const list = keys.split(",").map((k) => k.trim()).filter(Boolean);
      return `<span class="cite" data-keys="${esc(list.join(" "))}">[${esc(list.join(", "))}]</span>`;
    });
  }
}

/** The slice of an mdast node this plugin reads; the directive fields come from `remark-directive`. */
interface MdNode {
  type: string;
  name?: string;
  value?: string;
  attributes?: Record<string, string | null | undefined>;
  children?: MdNode[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

/** `:defterm` / `:refterm` -> a definition and its link; any other directive back to its source text. */
function glossaryDirectives(source: string) {
  return () => (tree: MdNode) => {
    visit(tree as Parameters<typeof visit>[0], (raw, index, rawParent) => {
      const node = raw as unknown as MdNode;
      const parent = rawParent as unknown as MdNode | undefined;
      if (!["textDirective", "leafDirective", "containerDirective"].includes(node.type)) return;
      const label = (node.children ?? []).map((c) => c.value ?? "").join("");
      const slug = (node.attributes?.id ?? label).toString().trim().toLowerCase().replace(/\s+/g, "-");
      if (node.type === "textDirective" && node.name === "defterm") {
        node.data = { hName: "dfn", hProperties: { className: ["defterm"], id: `term-${slug}` } };
      } else if (node.type === "textDirective" && node.name === "refterm") {
        node.data = { hName: "a", hProperties: { className: ["refterm"], href: `#term-${slug}` } };
      } else if (parent?.children && typeof index === "number" && node.position) {
        const text = source.slice(node.position.start.offset, node.position.end.offset);
        parent.children.splice(index, 1, { type: "text", value: text });
      }
    });
  };
}

/**
 * A line that is ONLY `$$…$$` is display math as its author meant it, but
 * `remark-math` reads `$$x$$` on one line as inline. Split it onto three lines,
 * outside fenced code, so it renders as a display.
 */
export function displayMathLines(markdown: string): string {
  let fenced = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      const m = fenced ? null : /^(\s*)\$\$(.+)\$\$\s*$/.exec(line);
      return m && !m[2].includes("$$") ? `${m[1]}$$\n${m[1]}${m[2]}\n${m[1]}$$` : line;
    })
    .join("\n");
}


/**
 * Four ways valid TeX in a Markdown block is misread before KaTeX sees it,
 * each found by the rendered-content QA on qou (folio-site-qa.ts), and each
 * fixed here by rewriting to an equivalent KaTeX accepts. Outside fenced code.
 *
 * - `\text{$n$-body}` inside math: the inner `$` ends the outer equation.
 *   Rewritten to `\text{\(n\)-body}`, which KaTeX reads the same way.
 * - `|` inside math in a GFM table row: the table splits the cell on it.
 *   Rewritten to `\vert `.
 * - `$a$$b$` — two inline equations with nothing between them reads as `$$`.
 *   A space is put between them.
 * - `\ref{x}` / `\eqref{x}` in prose: a link to the label's anchor.
 * - `psmallmatrix` (mathtools), which KaTeX lacks: `\left(` `smallmatrix` `\right)`.
 */
export function texInMarkdown(markdown: string): string {
  let fenced = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return line;
      let out = line.replace(/\\text\{([^{}]*)\}/g, (m, body: string) => {
        if (!body.includes("$")) return m;
        let open = true;
        return `\\text{${body.replace(/\$/g, () => ((open = !open) ? "\\)" : "\\("))}}`;
      });
      if (/^\s*\|/.test(out)) out = out.replace(/\$([^$\n]+)\$/g, (_m, tex: string) => `$${tex.replace(/(?<!\\)\|/g, "\\vert ")}$`);
      if (!/^\s*\$\$/.test(out)) out = out.replace(/([^$\s\\])\$\$([^$\s])/g, "$1$ $$$2");
      // mathtools' `psmallmatrix` is not a KaTeX environment; `smallmatrix` in parentheses is the same matrix.
      out = out.replace(/\\begin\{psmallmatrix\}/g, "\\left(\\begin{smallmatrix}").replace(/\\end\{psmallmatrix\}/g, "\\end{smallmatrix}\\right)");
      out = out.replace(/\\(?:eq)?ref\{([^}]+)\}/g, (_m, label: string) => `<a href="#${esc(label)}">${esc(label)}</a>`);
      return out;
    })
    .join("\n");
}

/** One document's Markdown to HTML. */
export async function renderDocumentHtml(markdown: string, opts: { math: boolean }): Promise<string> {
  const source = citationsToHtml(opts.math ? texInMarkdown(displayMathLines(markdown)) : markdown);
  const base = opts.math ? remark().use(remarkMath) : remark();
  const proc = base.use(remarkGfm).use(remarkDirective).use(glossaryDirectives(source)).use(remarkHtml, { sanitize: false });
  return String(await proc.process(source));
}

/** Every document in the folio: `folio/<slug>/<slug>.ts`, as the adapter resolves them. */
export function documentManifests(repoRoot: string): { slug: string; path: string }[] {
  const root = folioDir(repoRoot);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ slug: d.name, path: join(root, d.name, `${d.name}.ts`) }))
    .filter((d) => existsSync(d.path))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export const OUTLINE_SCHEMA = "folio-outline/v1" as const;

export interface OutlineSection {
  /** The ChangeSet's section key: `<chapter dir>::<label ?? title>`. */
  key: string;
  title: string;
  label?: string;
  /** Block labels in manifest order. */
  blocks: string[];
}
export interface OutlineDocument {
  slug: string;
  title: string;
  /** The document's page, relative to the site root. */
  page: string;
  chapters: Array<{ title: string; label?: string; sections: OutlineSection[] }>;
}
export interface Outline {
  $schema: typeof OUTLINE_SCHEMA;
  documents: OutlineDocument[];
}

const isRef = (s: Section | SectionRef): s is SectionRef => !("blocks" in s);

/** One document's outline. Loads the manifests the Markdown build already loads. */
export async function documentOutline(manifestPath: string, folioRoot: string, slug: string): Promise<OutlineDocument> {
  const docDir = dirname(manifestPath);
  const paper = (await import(manifestPath)).default as Paper;
  const doc: OutlineDocument = { slug, title: paper.title ?? slug, page: `${slug}/index.html`, chapters: [] };
  for (const chRef of paper.chapters) {
    const chDir = join(docDir, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);
    if (!existsSync(chPath)) continue;
    const chapter = (await import(chPath)).default as Chapter;
    const rel = relative(folioRoot, chDir) || ".";
    const sections: OutlineSection[] = [];
    const walk = async (secs: Array<Section | SectionRef>) => {
      for (const sec of secs) {
        if (isRef(sec)) continue;
        const labels: string[] = [];
        for (const root of sec.blocks) {
          const ts = join(chDir, `${root}.ts`);
          if (!existsSync(ts)) continue;
          const b = (await import(ts)).default as { label?: string };
          if (b.label) labels.push(b.label);
        }
        sections.push({ key: `${rel}::${sec.label ?? sec.title}`, title: sec.title, ...(sec.label ? { label: sec.label } : {}), blocks: labels });
        if (sec.subsections) await walk(sec.subsections);
      }
    };
    await walk(chapter.sections);
    doc.chapters.push({ title: chapter.title, ...(chapter.label ? { label: chapter.label } : {}), sections });
  }
  return doc;
}

/**
 * Every labelled block of one document, with its source file and section, in
 * manifest order: what [edit] and [feedback] are built from (`block-actions`).
 * The source is the block's `.md` when it has one (the prose a person edits),
 * else its `.ts` manifest.
 */
export async function documentBlocks(manifestPath: string, repoRoot: string, slug: string): Promise<BlockContext[]> {
  const docDir = dirname(manifestPath);
  const paper = (await import(manifestPath)).default as Paper;
  const out: BlockContext[] = [];
  for (const chRef of paper.chapters) {
    const chDir = join(docDir, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);
    if (!existsSync(chPath)) continue;
    const chapter = (await import(chPath)).default as Chapter;
    const walk = async (secs: Array<Section | SectionRef>) => {
      for (const sec of secs) {
        if (isRef(sec)) continue;
        for (const root of sec.blocks) {
          const ts = join(chDir, `${root}.ts`);
          if (!existsSync(ts)) continue;
          const b = (await import(ts)).default as { label?: string };
          if (!b.label) continue;
          const md = join(chDir, `${root}.md`);
          out.push({ label: b.label, source: relative(repoRoot, existsSync(md) ? md : ts), section: sec.title, page: `${slug}/index.html` });
        }
        if (sec.subsections) await walk(sec.subsections);
      }
    };
    await walk(chapter.sections);
  }
  return out;
}

/**
 * Where [edit] and [feedback] point, from the build's environment: the
 * repository is `GITHUB_REPOSITORY` in CI, else the checkout's `origin`; the
 * issue form is the folio's `.github/ISSUE_TEMPLATE/block-feedback.yml` when
 * it has one. Explicit options win.
 */
export function defaultBlockActions(repoRoot: string, over: Partial<BlockActionsConfig> = {}): BlockActionsConfig {
  const origin = detectRepoUrl(repoRoot);
  const repo = over.repo ?? process.env.GITHUB_REPOSITORY ?? (origin?.includes("github.com") ? ownerRepo(origin) : undefined);
  const template = over.template ?? DEFAULT_TEMPLATE;
  const fields = readIssueForm(repoRoot, template);
  return {
    ...(repo ? { repo } : {}),
    branch: over.branch ?? "main",
    ...(fields ? { template, templateFields: fields } : {}),
    ...(over.labels ? { labels: over.labels } : {}),
    ...(over.siteUrl ? { siteUrl: over.siteUrl } : {}),
  };
}

export interface SiteBuildResult {
  documents: { slug: string; blocks: number; page: string }[];
  errors: string[];
}

export async function buildDocumentSite(
  repoRoot: string,
  outDir: string,
  opts: { math?: boolean; actions?: Partial<BlockActionsConfig> | false; lazy?: "auto" | "always" | "never" } = {},
): Promise<SiteBuildResult> {
  // Math defaults on only for a paper instance; see the note on renderDocumentHtml.
  const math = opts.math ?? readHarnessConfig(repoRoot)?.contentType === "paper";
  const docs = documentManifests(repoRoot);
  const result: SiteBuildResult = { documents: [], errors: [] };
  if (docs.length === 0) {
    result.errors.push(`no document manifest under ${folioDir(repoRoot)} (expected folio/<slug>/<slug>.ts)`);
    return result;
  }
  mkdirSync(outDir, { recursive: true });
  for (const d of docs) {
    const built = await buildDocumentMarkdown(d.path);
    for (const i of built.issues) if (i.level === "error") result.errors.push(`${d.slug}: ${i.message}`);
    const html = await renderDocumentHtml(built.markdown, { math });
    const manifest = (await import(d.path)).default as Paper;
    const dir = join(outDir, d.slug);
    mkdirSync(dir, { recursive: true });
    const mathOpts = math ? { macros: katexMacros(manifest.macros) } : undefined;
    const blocks = await documentBlocks(d.path, repoRoot, d.slug);
    const cfg = opts.actions === false ? undefined : defaultBlockActions(repoRoot, { content: d.slug, ...(opts.actions ?? {}) });
    // [edit] and [feedback] on every block (REQ-17, bean uphx). Off only when asked.
    const withActions = (h: string, compact = false) => (cfg ? injectBlockActions(h, blocks, cfg, { compact }).html : h);
    const lazy = opts.lazy === "always" || ((opts.lazy ?? "auto") === "auto" && blocks.length >= LAZY_THRESHOLD);
    if (!lazy) {
      writeFileSync(join(dir, "index.html"), withActions(page(manifest.title ?? d.slug, html, mathOpts)));
    } else {
      // The whole document on one page, for file://, no-JS readers and tools.
      writeFileSync(join(dir, "index.hydrated.html"), withActions(page(manifest.title ?? d.slug, html, mathOpts)));
      const split = splitBlocks(built.markdown, new Set(blocks.map((b) => b.label)));
      const index = { chunks: 0, of: {} as Record<string, number>, ids: {} as Record<string, number> };
      mkdirSync(join(dir, "blocks"), { recursive: true });
      for (let i = 0; i < split.blocks.length; i += LAZY_CHUNK) {
        const n = index.chunks++;
        const chunk: Record<string, string> = {};
        for (const b of split.blocks.slice(i, i + LAZY_CHUNK)) {
          const h = await renderDocumentHtml(b.markdown, { math });
          chunk[b.label] = h;
          index.of[b.label] = n;
          for (const id of idsIn(h)) index.ids[id] ??= n;
        }
        writeFileSync(join(dir, "blocks", `${String(n).padStart(3, "0")}.json`), JSON.stringify(chunk));
      }
      const shellHtml = await renderDocumentHtml(split.shell, { math });
      const note = `<p class="fa-one-page">The text loads as you read. <a href="index.hydrated.html">The whole document on one page.</a></p>\n<noscript><p><a href="index.hydrated.html">Read the whole document on one page.</a></p></noscript>\n`;
      writeFileSync(join(dir, "index.html"), withActions(page(manifest.title ?? d.slug, note + shellHtml, mathOpts, lazyLoader(index)), true));
    }
    // A document's images live in `folio/<slug>/media/` and its blocks link
    // them as `media/<file>`, relative to the document's page. Copied, so a
    // figure in the preview is the figure in the folio.
    const media = join(dirname(d.path), "media");
    if (existsSync(media)) cpSync(media, join(dir, "media"), { recursive: true });
    result.documents.push({ slug: d.slug, blocks: built.blockCount, page: `${d.slug}/index.html` });
  }
  const list = result.documents
    .map((d) => `<li><a href="${esc(d.page)}">${esc(d.slug)}</a> (${d.blocks} blocks)</li>`)
    .join("\n");
  const outline: Outline = { $schema: OUTLINE_SCHEMA, documents: [] };
  for (const d of docs) outline.documents.push(await documentOutline(d.path, folioDir(repoRoot), d.slug));
  writeFileSync(join(outDir, "outline.json"), JSON.stringify(outline) + "\n");
  mkdirSync(join(outDir, "review"), { recursive: true });
  writeFileSync(join(outDir, "review", "index.html"), reviewPageHtml());
  writeFileSync(
    join(outDir, "index.html"),
    page("Documents", `<h1>Documents</h1>\n<p><a href="review/index.html">What changed from main</a></p>\n<ul>\n${list}\n</ul>`),
  );
  return result;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help")) {
    console.log(
      "usage: bun run folio-assistant-core/scripts/build-document-site.ts [--repo <folio repo root>] [--out _site] [--math | --no-math]\n" +
        "         [--github <owner/repo>] [--edit-branch main] [--issue-template block-feedback.yml] [--site-url <url>] [--no-block-actions]\n" +
        "         [--lazy auto|always|never]   (auto: a document of " + LAZY_THRESHOLD + "+ blocks loads its text as data)",
    );
    process.exit(0);
  }
  const repo = resolve(opt("repo") ?? process.cwd());
  const out = resolve(repo, opt("out") ?? "_site");
  const math = args.includes("--math") ? true : args.includes("--no-math") ? false : undefined;
  const actions = args.includes("--no-block-actions")
    ? false
    : {
        ...(opt("github") ? { repo: opt("github") } : {}),
        ...(opt("edit-branch") ? { branch: opt("edit-branch") } : {}),
        ...(opt("issue-template") ? { template: opt("issue-template") } : {}),
        ...(opt("site-url") ? { siteUrl: opt("site-url") } : {}),
      };
  const lazyOpt = opt("lazy");
  if (lazyOpt && !["auto", "always", "never"].includes(lazyOpt)) {
    console.error(`✗ --lazy must be auto, always or never, not ${lazyOpt}`);
    process.exit(2);
  }
  const r = await buildDocumentSite(repo, out, { math, actions, ...(lazyOpt ? { lazy: lazyOpt as "auto" | "always" | "never" } : {}) });
  for (const d of r.documents) console.error(`  ${d.page}  ${d.blocks} block(s)`);
  if (r.errors.length > 0) {
    for (const e of r.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.error(`✓ ${r.documents.length} document(s) → ${relative(repo, out) || "."}`);
}
