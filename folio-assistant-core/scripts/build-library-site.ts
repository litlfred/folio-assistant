#!/usr/bin/env bun
/**
 * build-library-site — a FOLIO's library, on the folio's own site: each entry
 * that carries a `structure.json` gets the Document view (contents, pages,
 * figures and tables, sections, checks) the platform's library viewer draws
 * (#2302), with [source] and [feedback] on the document and every section,
 * and [edit] where the section was MATERIALISED into the folio (bean zcak).
 *
 * ## Why edit opens the folio, never the library
 *
 * Owner, 2026-10-07: *"published 'draft for public comment' goes in library/,
 * changes to it from PC review go under folio/"* and *"if viewing in library,
 * edit -> materialized version in folio/'s edit"*. A library entry is a
 * frozen source; the folio is where it is edited. A folio that materialised
 * an entry says so in a `folio-review-anchors/v1` file (`review-anchors.json`,
 * written by `docx-to-folio.ts`) whose `library` names the entry: it lists the
 * folio's sections, by number and title, and the blocks in each. A library
 * section maps to the FIRST block of the folio section with the same number,
 * or, unnumbered, the same title. A section that maps to nothing gets no
 * [edit]: it has nowhere to be edited, and a guess would be a wrong link.
 *
 * ## One view, not two
 *
 * The page runs the platform's own `DOCUMENT_VIEW_JS` and `VIEWER_CSS`, and
 * the links come from the shared recipe (`EDIT_LINKS_RUNTIME`, bean v433), so
 * a fix to the Document view or to the links reaches this page too.
 *
 *   bun run folio-assistant-core/scripts/build-library-site.ts [--repo <folio root>] --out _site
 *
 * Writes, under `<out>/<handler>/<library dir>/` (the route rule every
 * viewer follows: `<base>/<handler>/<kind>/<subject>`, handler = this
 * instance, folio-assistant-core), `index.html` and per entry with a
 * structure `<id>/index.html` and `<id>/entries/<id>.doc.json`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { folioDir, readDeclaration } from "../../cat-harness/schemas/cat-harness.js";
import { readEntryDocument, DOCUMENT_VIEW_JS, type DocumentView, type EntryLinks } from "../../cat-harness/scripts/lib/library-document.ts";
import { VIEWER_CSS } from "../../cat-harness/scripts/gen-library-viz.ts";
import { EDIT_LINKS_RUNTIME } from "../../cat-harness/src/core/edit-links.js";
import { defaultBlockActions } from "./build-document-site.js";

/** This instance: the HANDLER segment of every page it publishes. */
export const HANDLER = (readDeclaration(join(import.meta.dir, "..")) as { name?: string } | undefined)?.name ?? "folio-assistant-core";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const posix = (p: string) => p.split("\\").join("/");

/** The folio's declared library directories, absolute. */
export function libraryDirs(repoRoot: string): string[] {
  const decl = readDeclaration(repoRoot) as { directories?: { path: string; graphTypologies?: string[] }[] } | undefined;
  return (decl?.directories ?? [])
    .filter((d) => (d.graphTypologies ?? []).includes("library"))
    .map((d) => resolve(repoRoot, d.path))
    .filter((d) => existsSync(d));
}

interface Anchors {
  $schema: string;
  library?: string;
  sections: { label: string; number?: string; title: string }[];
  blocks: { label: string; chapter: string; root: string; sections: string[] }[];
}

/** Every `review-anchors.json` under the folio directory (shallow: documents and their chapters). */
function anchorFiles(repoRoot: string): string[] {
  const out: string[] = [];
  const walk = (d: string, depth: number) => {
    if (depth > 3 || !existsSync(d)) return;
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (f === "review-anchors.json") out.push(p);
      else if (depth < 3 && !f.startsWith(".") && statSync(p).isDirectory()) walk(p, depth + 1);
    }
  };
  walk(folioDir(repoRoot), 0);
  return out.sort();
}

/**
 * Where each section of library entry `id` was materialised in the folio:
 * the first block of the folio section with the same number, else title.
 */
export function materialisedEdits(repoRoot: string, id: string): EntryLinks["editFor"] | undefined {
  return materialisation(repoRoot, id)?.editFor;
}

/** The folio document an entry was materialised as: its title, and where each section went. */
export function materialisation(repoRoot: string, id: string): { title?: string; editFor: NonNullable<EntryLinks["editFor"]> } | undefined {
  for (const f of anchorFiles(repoRoot)) {
    let a: Anchors;
    try {
      a = JSON.parse(readFileSync(f, "utf-8"));
    } catch {
      continue;
    }
    if (a.$schema !== "folio-review-anchors/v1" || a.library !== id) continue;
    const docDir = dirname(f);
    const firstBlock = new Map<string, { path: string; label: string }>();
    for (const b of a.blocks) {
      for (const s of b.sections) {
        if (firstBlock.has(s)) continue;
        const base = join(docDir, b.chapter, b.root);
        const file = existsSync(`${base}.md`) ? `${base}.md` : existsSync(`${base}.ts`) ? `${base}.ts` : undefined;
        if (file) firstBlock.set(s, { path: posix(relative(repoRoot, file)), label: b.label });
      }
    }
    const byNumber = new Map<string, { path: string; label: string }>();
    const byTitle = new Map<string, { path: string; label: string }>();
    for (const s of a.sections) {
      const hit = firstBlock.get(s.label);
      if (!hit) continue;
      if (s.number && !byNumber.has(s.number)) byNumber.set(s.number, hit);
      if (!byTitle.has(norm(s.title))) byTitle.set(norm(s.title), hit);
    }
    // The document's own title, from its manifest: the extractor's page-1
    // guess ("DRAFT V1.0") is never a title (issue #1794).
    const manifest = join(docDir, `${(a as { document?: string }).document ?? ""}.ts`);
    const title = existsSync(manifest) ? /\btitle:\s*["'`]([^"'`]+)["'`]/.exec(readFileSync(manifest, "utf-8"))?.[1] : undefined;
    return {
      ...(title ? { title } : {}),
      editFor: (s) => (s.number ? byNumber.get(s.number) : undefined) ?? byTitle.get(norm(s.title)),
    };
  }
  return undefined;
}

/** One entry's Document view, with its links. `null` when it has no structure. */
export function entryView(repoRoot: string, entryDir: string, repo?: string): DocumentView | null {
  const id = entryDir.split(/[\\/]/).pop()!;
  const m = materialisation(repoRoot, id);
  const view = readEntryDocument(entryDir, id, {
    ...(repo ? { links: { repo, dir: posix(relative(repoRoot, entryDir)), ...(m ? { editFor: m.editFor } : {}) } } : {}),
  });
  if (view && m?.title) view.title = `${m.title} — the version published for public comment`;
  return view;
}

function page(title: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${VIEWER_CSS}
body { max-width: 72rem; margin: 0 auto; padding: 1rem 16px; }
.doc-actions a { margin-left: .4em; font-size: .8rem; font-weight: normal; }
</style>
</head>
<body>
${body}
${script}
</body>
</html>
`;
}

/** The entry page: the Document view, loaded from its JSON beside the page. */
function entryPage(id: string, title: string): string {
  const js = `
function $(i){ return document.getElementById(i); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
var DATA_HREF = new URL("./index.json", location.href).href;
${EDIT_LINKS_RUNTIME}
${DOCUMENT_VIEW_JS}
loadDocument(${JSON.stringify(id)});
`;
  return page(
    `${title} — library`,
    `<p><a href="../">Library</a></p>
<h1>${esc(title)}</h1>
<p class="note">A frozen source: the library keeps it exactly as published. Edits are made in the folio, and each section's ✎ edit opens the folio block made from it.</p>
<section id="document"><p class="note">Loading the document…</p></section>
<noscript><p>This page draws the document from <a href="entries/${esc(encodeURIComponent(id))}.doc.json">its JSON</a>; it needs JavaScript.</p></noscript>`,
    `<script>${js}</script>`,
  );
}

export interface LibrarySiteResult {
  entries: { seg: string; id: string; title: string; pages: number; sections: number; editable: number }[];
}

export function buildLibrarySite(repoRoot: string, outDir: string, opts: { repo?: string } = {}): LibrarySiteResult {
  const repo = opts.repo ?? defaultBlockActions(repoRoot).repo;
  const result: LibrarySiteResult = { entries: [] };
  for (const lib of libraryDirs(repoRoot)) {
    for (const name of readdirSync(lib).sort()) {
      const dir = join(lib, name);
      if (name.startsWith(".") || !statSync(dir).isDirectory()) continue;
      const view = entryView(repoRoot, dir, repo);
      if (!view) continue;
      const title = view.title ?? name;
      const at = join(outDir, HANDLER, basename(lib), name);
      mkdirSync(join(at, "entries"), { recursive: true });
      writeFileSync(join(at, "entries", `${name}.doc.json`), JSON.stringify(view) + "\n");
      writeFileSync(join(at, "index.html"), entryPage(name, title));
      result.entries.push({ seg: basename(lib), id: name, title, pages: view.pages, sections: view.sections.length, editable: view.sections.filter((s) => s.edit).length });
    }
  }
  if (result.entries.length) {
    const rows = result.entries
      .map((e) => `<li><a href="${esc(encodeURIComponent(e.id))}/">${esc(e.title)}</a> <span class="note">${e.pages} pages, ${e.sections} sections${e.editable ? `, ${e.editable} materialised in the folio` : ""}</span></li>`)
      .join("\n");
    writeFileSync(join(outDir, HANDLER, result.entries[0]!.seg, "index.html"), page("Library", `<h1>Library</h1>\n<p class="note">Frozen sources. Each opens on its table of contents.</p>\n<ul>\n${rows}\n</ul>`));
  }
  return result;
}

/**
 * What this builder READS (bean `ehh6`): the declared library directories and
 * the folio (its review anchors say where an entry was materialised).
 */
export function siteReads(repoRoot: string, args: string[] = []): string[] {
  const i = args.indexOf("--repo");
  const repo = i >= 0 && args[i + 1] ? resolve(repoRoot, args[i + 1]!) : repoRoot;
  const rel = (p: string) => posix(relative(repoRoot, p));
  return [...libraryDirs(repo).map(rel), rel(folioDir(repo))];
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const repoRoot = resolve(opt("repo") ?? process.cwd());
  const out = resolve(opt("out") ?? "_site");
  const r = buildLibrarySite(repoRoot, out, opt("github") ? { repo: opt("github") } : {});
  if (!r.entries.length) console.error("· no library entry with a structure.json — nothing to draw");
  for (const e of r.entries) console.error(`✓ ${HANDLER}/${e.seg}/${e.id}/: ${e.pages} pages, ${e.sections} sections, ${e.editable} with ✎ edit into the folio`);
}
