#!/usr/bin/env bun
/**
 * Publish the schema graph as a projection, and a viewer over it.
 *
 * @module scripts/gen-schema-viz
 * @graphNode none — a generator over the schema graph, not a schema itself
 *
 * ## The three pieces, and why the projection is separate from the page
 *
 * `schema-graph.ts` reads; this writes two artefacts and neither is the other:
 *
 * - **`<site>/assets/schemas/index.json`** — the projection. One indented JSON
 *   file, emitted through the same `--check` contract `gen-docs-pages.ts`
 *   uses for the todo and bean indices.
 * - **`<site>/schemas/index.html`** — the viewer. Carries no data of its own
 *   and fetches the projection **relative to its own location**, so the same
 *   bytes are correct at the canonical base and at a staging slug. That rule
 *   is `kg-viewer.ts`'s and it is the reason there is no base URL anywhere in
 *   this file.
 *
 * Keeping them apart is what lets something ELSE draw the graph. A viewer that
 * embedded its data would make every other consumer re-read the `.ts`.
 *
 * ## Where they go — resolved, never composed
 *
 * The owner's rule, 2026-09-20: rendered assets live at
 * `<base>/<instantiated harness>/<path to rendered content>`, relative to the
 * instance's own URL — bootstrap's `.jsonld`/`.json` being the worked example.
 * So there is **no top-level `schema/` segment** here and no instance name
 * written down. `siteDirFor` resolves this instance's rendered-content root
 * from its declaration and everything hangs off that. Bean `8325` carries the
 * general rule and the three questions still open on it; this file only has to
 * avoid pre-empting them, which it does by resolving rather than composing.
 *
 * ## Why a faceted index with a ONE-TYPE diagram, and not a class diagram
 *
 * 713 declarations and 464 edges do not want to be one UML diagram. That
 * renders as a wall: it looks like a data model and answers no question about
 * one. It is the same argument `kg-viewer.ts` made for 1111 KG nodes and won,
 * and the owner's own ask — *"browsable, so i can give overview like
 * browsing"* — is a navigation requirement rather than a poster requirement.
 *
 * So the diagram is a **view over the projection** rather than the output
 * format: one selected declaration, drawn as a UML class with its fields, its
 * generalisations above it and its references below. Everything else is the
 * index. Adding a whole-corpus render later costs nothing, because the
 * projection already carries every edge.
 *
 * ## Zero dependencies, and the SVG is hand-built for that reason
 *
 * No CDN, no framework, no build step — `kg-viewer.ts`'s rule, and the
 * argument is unchanged: a page that needs a network fetch to render cannot be
 * opened from a file, cannot be reviewed offline, and adds a third party to
 * the trust boundary of a page whose whole job is to display this repository's
 * own data. Mermaid would have been fewer lines and is exactly that third
 * party.
 *
 * Usage:
 *   bun run schema:viz          # write
 *   bun run schema:viz:check    # fail if either artefact is stale
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";

import { readSchemaGraph, schemaRoots, type SchemaGraph } from "./schema-graph.ts";
import { readDeclaration, siteDirFor } from "../schemas/cat-harness.ts";
// The `folio` graph kind is registered by CORE on import; this module resolves
// this instance's directories and the instance declares a folio graph.
import "../schemas/folio-graph-kind.js";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");

/**
 * How much of a declaration's doc the projection carries.
 *
 * The same argument the bean index records for its body preview: enough for a
 * detail panel, and a reader who wants the whole docblock follows the source
 * link. Measured at this length — see the size report the run prints.
 */
const DOC_MAX = 400;

/** The projection, trimmed for the page. */
function projection(g: SchemaGraph): unknown {
  return {
    $schema: "folio-schema-graph/v1",
    roots: g.roots,
    modules: g.modules.map((m) => ({
      module: m.module,
      instance: m.instance,
      name: m.name,
      graphNode: m.graphNode,
      ...(m.reason ? { reason: m.reason } : {}),
      ...(m.summary ? { summary: m.summary.slice(0, DOC_MAX) } : {}),
      isTest: m.isTest,
      // `decls` is NOT carried. A declaration already names its module, so a
      // per-module id list is the same fact written twice — one fact, one
      // place, which is the rule `data-modelling` states and the reason the
      // projection groups client-side instead. Measured: it cost 50 KB of the
      // 866 KB raw file to say something the `decls` array already says.
    })),
    decls: g.decls.map((d) => ({
      id: d.id,
      name: d.name,
      module: d.module,
      kind: d.kind,
      ...(d.note ? { note: d.note } : {}),
      ...(d.doc ? { doc: d.doc.slice(0, DOC_MAX) } : {}),
      fields: d.fields.map((f) => ({
        name: f.name,
        type: f.type,
        optional: f.optional,
        array: f.array,
        ...(f.doc ? { doc: f.doc.slice(0, DOC_MAX) } : {}),
      })),
      extendsNames: d.extendsNames,
      values: d.values,
      refs: d.refs,
      unresolved: d.unresolved,
      external: d.external,
      // `line` is NOT carried, and the reader keeps it — the difference is
      // the whole of this comment.
      //
      // A line number is an EDITOR COORDINATE, not a property of a
      // declaration. Carrying it made the committed projection change
      // whenever anything above a declaration moved, so the staleness gate
      // fired on edits that changed nothing about the schema graph. Measured
      // on this very branch: merging main shifted two declarations in
      // `cat-harness.ts` by 36 lines and nothing else in 895 KB differed —
      // the gate went red over two integers.
      //
      // That fails the standard this repository applies to its own gates. The
      // comment on `gen-docs-pages --check` states what a red there means:
      // "somebody added a node, renamed a block, ran a first sweep, or moved
      // a sidecar, and did not regenerate. A real omission, every time." A red
      // here would have meant "somebody added a blank line in a schema file",
      // which is not an omission and teaches contributors to regenerate
      // reflexively rather than to read the finding.
      //
      // The cost is the deep link: the viewer names the module and not the
      // line. That is the right trade — a stale anchor is wrong silently,
      // while a module path stays correct under every reformat.
      exported: d.exported,
    })),
    edges: g.edges,
  };
}

/**
 * The viewer page.
 *
 * One file, no data. It reads its projection relative to its
 * own URL — the page sits at `<site>/schemas/` and the projection at
 * `<site>/assets/schemas/`, so the relative path is a property of the layout
 * rather than of the host.
 */

/**
 * Where a viewer of a declared directory is published, and the relative path
 * from it back to its data.
 *
 * ## The rule — the URL IS the directory's path in the knowledge graph
 *
 * Owner, 2026-09-20, settling bean `o7eq`'s third case:
 *
 * > it `<baseurl>/<path to kind in knowledge graph>` or
 * > `<path to dir handled>/<optional subject>`
 *
 * So the segment is **the declared directory's own repo-relative path**, and
 * `<subject>` is optional — a viewer with no subject is the view over all of
 * them.
 *
 * **This is a resolution, not a composition, and the difference is not
 * cosmetic.** The first draft of this function composed `<owner>/<kind>` from
 * the rendering instance's name and the graph kind. That gives the right
 * answer for `cat-harness/schemas/` by coincidence — the directory happens to
 * sit at owner/kind — and the WRONG one for every directory that does not:
 * `who-iris/library/` would have been addressed as `cat-harness/library`,
 * naming the machinery where the rule names the data. Taking the path means
 * the two can never disagree, because there is only one of them.
 *
 * ## Why the data path is computed rather than written
 *
 * The projection stays at `<site>/assets/<kind>/`, and the page fetches it
 * RELATIVE to its own location so the same bytes are correct at the canonical
 * base and at a staging slug. A page at `cat-harness/schemas/` is two levels
 * down rather than one, and a literal `../assets/...` would have kept parsing
 * and fetched nothing. Deriving it means the layout can move again without a
 * silent 404.
 */
export function viewerPlacement(
  site: string,
  /** The handled directory's repo-relative path, e.g. `cat-harness/schemas`. */
  dirPath: string,
  /** The graph kind, which names the projection's own directory. */
  kind: string,
): { pageDir: string; dataDir: string; dataHref: string } {
  const pageDir = join(site, ...dirPath.split("/"));
  const dataDir = join(site, "assets", kind);
  const dataHref = relative(pageDir, join(dataDir, "index.json")).split(sep).join("/");
  return { pageDir, dataDir, dataHref };
}

export function viewerHtml(dataHref: string, scope = ""): string {
  // NO BACKTICKS BELOW THIS LINE — not in strings, not in comments.
  //
  // The whole page is one template literal, so a backtick anywhere inside it
  // terminates the string and the rest becomes TypeScript. It fails at a line
  // number far from the mistake, and it has happened twice: once in a comment
  // reading "the intake's own files[]", once in one quoting a field
  // declaration. `viz-generators.test.ts` imports this module, so a stray one
  // reddens the suite rather than only the generator.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Schema graph</title>
<!-- Inline, so the page fetches nothing but its own projection. A missing
     favicon is a 404 on every load, which puts a red line in the console of a
     page whose console is where a reader would look for a real failure. -->
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%231a5fb4'/%3E%3Crect x='3' y='4' width='10' height='3' fill='white'/%3E%3Crect x='3' y='9' width='7' height='3' fill='white'/%3E%3C/svg%3E">
<style>
:root {
  --bg: #ffffff; --fg: #17191c; --muted: #5b6168; --line: #d9dde2;
  --panel: #f6f7f9; --accent: #1a5fb4; --accent-soft: #e7eefb;
  --warn: #8a5300; --warn-soft: #fdf3e0; --box: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #14171a; --fg: #e8eaed; --muted: #9aa2ab; --line: #2e343b;
    --panel: #1b1f24; --accent: #7aa7e8; --accent-soft: #1d2937;
    --warn: #e0b25e; --warn-soft: #2a2213; --box: #1b1f24;
  }
}
:root[data-theme="dark"] {
  --bg: #14171a; --fg: #e8eaed; --muted: #9aa2ab; --line: #2e343b;
  --panel: #1b1f24; --accent: #7aa7e8; --accent-soft: #1d2937;
  --warn: #e0b25e; --warn-soft: #2a2213; --box: #1b1f24;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
header { padding: 16px; border-bottom: 1px solid var(--line); }
h1 { font-size: 1.15rem; margin: 0 0 4px; }
.counts { color: var(--muted); font-size: .85rem; }
.counts b { color: var(--fg); font-variant-numeric: tabular-nums; }
main { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.4fr); gap: 0; }
@media (max-width: 900px) { main { grid-template-columns: 1fr; } }
#list { border-right: 1px solid var(--line); min-height: 60vh; }
@media (max-width: 900px) { #list { border-right: none; border-bottom: 1px solid var(--line); } }
.controls { padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 8px; }
input, select, button {
  font: inherit; color: var(--fg); background: var(--box);
  border: 1px solid var(--line); border-radius: 6px; padding: 6px 9px;
}
input { flex: 1 1 180px; min-width: 0; }
ul { list-style: none; margin: 0; padding: 0 0 24px; max-height: 70vh; overflow: auto; }
li > button {
  display: block; width: 100%; text-align: left; border: 0; border-radius: 0;
  border-bottom: 1px solid var(--line); background: transparent; padding: 9px 16px; cursor: pointer;
}
li > button:hover, li > button:focus-visible { background: var(--panel); }
li > button[aria-current="true"] { background: var(--accent-soft); }
.nm { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; }
.sub { color: var(--muted); font-size: .78rem; }
.tag {
  display: inline-block; font-size: .7rem; padding: 1px 6px; border-radius: 999px;
  border: 1px solid var(--line); color: var(--muted); margin-left: 6px; vertical-align: 1px;
}
.tag.warn { color: var(--warn); background: var(--warn-soft); border-color: var(--warn); }
#detail { padding: 16px; min-width: 0; }
#detail h2 { font-size: 1rem; margin: 0 0 2px; font-family: ui-monospace, Menlo, monospace; }
table { border-collapse: collapse; width: 100%; font-size: .86rem; margin: 8px 0 16px; }
th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: .76rem; text-transform: uppercase; letter-spacing: .04em; }
td code { font-family: ui-monospace, Menlo, monospace; font-size: .82rem; word-break: break-word; }
.opt { color: var(--muted); }
a { color: var(--accent); }
svg { max-width: 100%; height: auto; display: block; margin: 8px 0 16px; }
.uml-box { fill: var(--box); stroke: var(--line); }
.uml-box.sel { stroke: var(--accent); stroke-width: 2; }
.uml-t { fill: var(--fg); font: 600 12px ui-monospace, Menlo, monospace; }
.uml-f { fill: var(--muted); font: 11px ui-monospace, Menlo, monospace; }
.uml-e { stroke: var(--muted); fill: none; }
.uml-head { fill: var(--box); stroke: var(--muted); }
.uml-tip { fill: none; stroke: var(--muted); stroke-width: 1.4; }
.uml-l { fill: var(--muted); font: 10px ui-sans-serif, system-ui, sans-serif; }
.empty { color: var(--muted); padding: 24px 16px; }
.note { background: var(--warn-soft); border-left: 3px solid var(--warn); padding: 8px 12px; font-size: .85rem; margin: 8px 0; }
.note code { word-break: break-all; }
/* The overview panel. Collapsible and CLOSED by default: the questions people
   arrive with are local, so the list is what should meet them. The overview
   answers a different one — how connected is this, and where are the hubs —
   and that is worth a deliberate click rather than a scroll past. */
#overview { border-bottom: 1px solid var(--line); background: var(--panel); }
#overview > summary { cursor: pointer; padding: 10px 16px; font-weight: 600; font-size: .9rem; list-style: revert; }
#overview > summary:hover { color: var(--accent); }
#overview > summary::marker { color: var(--muted); }
.ov-body { padding: 0 16px 14px; }
.ov-cap { color: var(--muted); font-size: .8rem; margin: 0 0 8px; }
#ov-svg { width: 100%; height: auto; display: block; max-height: 78vh; }
.ov-e { fill: none; }
.ov-band { fill: none; stroke-width: 3; stroke-opacity: .85; }
.ov-n { stroke: var(--bg); stroke-width: 1.5; cursor: pointer; }
.ov-n:hover { stroke: var(--fg); }
.ov-t { fill: var(--muted); font: 9px ui-sans-serif, system-ui, sans-serif; pointer-events: none; }
.ov-g { fill: var(--fg); font: 10px ui-sans-serif, system-ui, sans-serif; font-weight: 600; pointer-events: none; }
.ov-key { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 0 0; font-size: .78rem; color: var(--muted); }
.ov-key span { display: inline-flex; align-items: center; gap: 5px; }
.ov-key i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
@media (max-width: 700px) { .ov-t { display: none; } }
</style>
</head>
<body>
<header>
  <h1>Schema graph</h1>
  <p class="counts" id="counts">loading…</p>
  <p class="counts" style="margin-top:4px">Diagrams show <strong>containment</strong> and
    <strong>generalisation</strong>. A reference carried as a string id is not drawn &mdash; it is
    invisible to a syntactic reader, not absent from the model.</p>
</header>
<details id="overview">
  <summary>Overview &mdash; how connected is this graph?</summary>
  <div class="ov-body">
    <p class="ov-cap" id="ov-cap">loading&hellip;</p>
    <svg id="ov-svg" role="img" aria-labelledby="ov-cap"></svg>
    <div class="ov-key" id="ov-key"></div>
  </div>
</details>
<main>
  <section id="list" aria-label="Declarations">
    <div class="controls">
      <input id="q" type="search" placeholder="Search declarations…" aria-label="Search declarations">
      <select id="kind" aria-label="Filter by kind"><option value="">any kind</option></select>
      <select id="mod" aria-label="Filter by module"><option value="">any module</option></select>
    </div>
    <ul id="items"></ul>
  </section>
  <section id="detail" aria-live="polite"><p class="empty">Select a declaration.</p></section>
</main>
<script>
"use strict";
var G = null, SEL = null;
var DATA_HREF = "${dataHref}";
/* The SUBJECT this page is scoped to, or "" for the handler's whole view.
   One projection serves every page — a second JSON per subject would be the
   same facts written N+1 times, free to disagree once one is regenerated. */
var SCOPE = "${scope}";
function inScope(d){ return !SCOPE || d.instance === SCOPE; }
var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function byId(id) { return G.declIndex[id]; }

/* A one-type UML neighbourhood: generalisations above, references below.
   Built as SVG text so the page keeps its no-dependency rule. */
function uml(d) {
  var CH = 7.0, PAD = 10, LH = 15, HEAD = 22;
  function box(x, y, title, fields, sel) {
    // Truncation is STATED, not silent. A box showing 8 of 24 fields with no
    // mark reads as a type with 8 fields, which is a wrong diagram rather than
    // an abbreviated one.
    var rows = fields.slice(0, 8);
    if (fields.length > rows.length) rows = rows.concat(["… " + (fields.length - rows.length) + " more"]);
    var w = Math.max(title.length, 8);
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    w = Math.min(w, 42) * CH + PAD * 2;
    var h = HEAD + (rows.length ? rows.length * LH + 6 : 0);
    var g = '<g><rect class="uml-box' + (sel ? " sel" : "") + '" x="' + x + '" y="' + y +
      '" width="' + w + '" height="' + h + '" rx="4"/>' +
      '<text class="uml-t" x="' + (x + PAD) + '" y="' + (y + 15) + '">' + esc(title.slice(0, 42)) + "</text>";
    if (rows.length) {
      g += '<line class="uml-e" x1="' + x + '" y1="' + (y + HEAD) + '" x2="' + (x + w) + '" y2="' + (y + HEAD) + '"/>';
      rows.forEach(function (r, i) {
        g += '<text class="uml-f" x="' + (x + PAD) + '" y="' + (y + HEAD + 14 + i * LH) + '">' + esc(r.slice(0, 42)) + "</text>";
      });
    }
    return { svg: g + "</g>", w: w, h: h };
  }
  var parents = (d.extendsNames || []).map(function (n) {
    var e = (G.edges || []).filter(function (x) { return x.from === d.id && x.kind === "extends"; })
      .map(function (x) { return byId(x.to); }).filter(Boolean)
      .find(function (t) { return t.name === n; });
    return e || { id: null, name: n, fields: [] };
  });
  var refs = [];
  (G.edges || []).forEach(function (x) {
    if (x.from !== d.id || x.kind !== "field") return;
    var t = byId(x.to);
    if (t && !refs.some(function (r) { return r.t.id === t.id; })) refs.push({ t: t, via: x.via, arr: x.array, opt: x.optional });
  });
  refs = refs.slice(0, 6);
  var selFields = (d.fields || []).map(function (f) {
    return f.name + (f.optional ? "?" : "") + ": " + f.type.replace(/^z\\./, "").slice(0, 28);
  });

  var W = 0, parts = [], y = 0;
  var px = 0, prow = [];
  parents.forEach(function (p) {
    var b = box(px, y, p.name, [], false);
    prow.push({ b: b, x: px, cx: px + b.w / 2, bottom: y + b.h });
    px += b.w + 24;
  });
  var prowW = px - 24;
  if (prow.length) { W = Math.max(W, prowW); y += 46; }
  var sel = box(0, y, d.name, selFields, true);
  var selTop = y, selBottom = y + sel.h, selCx = sel.w / 2;
  W = Math.max(W, sel.w);
  y += sel.h + 46;
  var rx = 0, rrow = [];
  refs.forEach(function (r) {
    var b = box(rx, y, r.t.name, [], false);
    rrow.push({ b: b, x: rx, cx: rx + b.w / 2, top: y, via: r.via + (r.arr ? "[]" : "") + (r.opt ? "?" : "") });
    rx += b.w + 24;
  });
  if (rrow.length) { W = Math.max(W, rx - 24); y += 40; } else { y -= 46; }

  // Shift the parent row so it sits over the selected box rather than at the
  // left margin: a generalisation that elbows sideways for no reason reads as
  // pointing somewhere else.
  var pShift = prow.length ? Math.max(0, Math.round(sel.w / 2 - prowW / 2)) : 0;
  if (pShift > 0) W = Math.max(W, prowW + pShift);
  prow.forEach(function (p) {
    p.cx += pShift;
    p.b.svg = p.b.svg.replace(/x="(\d+(?:\.\d+)?)"/, function (m0, v) {
      return 'x="' + (parseFloat(v) + pShift) + '"';
    });
    parts.push(p.b.svg);
    parts.push('<path class="uml-e" d="M' + p.cx + ' ' + p.bottom + ' L' + p.cx + ' ' + (selTop - 10) +
      ' L' + selCx + ' ' + (selTop - 10) + ' L' + selCx + ' ' + selTop + '" marker-end="url(#gen)"/>');
  });
  parts.push(sel.svg);
  rrow.forEach(function (r) {
    parts.push(r.b.svg);
    parts.push('<path class="uml-e" d="M' + selCx + ' ' + selBottom + ' L' + selCx + ' ' + (r.top - 14) +
      ' L' + r.cx + ' ' + (r.top - 14) + ' L' + r.cx + ' ' + r.top + '" marker-end="url(#ref)"/>');
    parts.push('<text class="uml-l" x="' + (r.cx + 4) + '" y="' + (r.top - 18) + '">' + esc(r.via) + "</text>");
  });
  var H = y + 8;
  return '<svg viewBox="0 0 ' + (W + 4) + " " + H + '" width="' + (W + 4) + '" role="img" aria-label="Neighbourhood of ' +
    esc(d.name) + '"><defs>' +
    /* UML notation, kept: a HOLLOW triangle is generalisation, an open arrow
       is an association. Drawing both the same way would say the two edge
       kinds are one relation, which is the thing the reader works to keep
       apart. */
    '<marker id="gen" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">' +
    '<path d="M1 1 L11 6 L1 11 z" class="uml-head"/></marker>' +
    '<marker id="ref" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
    '<path d="M1 1 L9 5 L1 9" class="uml-tip"/></marker></defs>' + parts.join("") + "</svg>";
}

function detail(d) {
  var referrers = (G.edges || []).filter(function (e) { return e.to === d.id; });
  var h = '<h2>' + esc(d.name) + '</h2><p class="sub">' + esc(d.module) +
    ' &middot; ' + esc(d.kind) + (d.exported ? "" : " &middot; not exported") + "</p>";
  if (d.doc) h += "<p>" + esc(d.doc) + "</p>";
  if (d.kind === "undetermined") {
    h += '<p class="note"><strong>Could not be classified.</strong> This is not "it has no fields" — ' +
      "the reader saw an expression it does not model, and says so rather than rendering an empty type: <code>" +
      esc(d.note || "") + "</code></p>";
  }
  h += uml(d);
  /* The diagram shows CONTAINMENT and generalisation. It cannot show a
     reference carried as a string id: a field declared as a plain string holds
     no syntactic link to the schema it names, and a diagram that omitted a
     whole class of relation silently would be the "rendered as nothing"
     failure this repository works to avoid. Measured against the hand-drawn
     UML: 14 of 15 compositions reproduced, 0 of 9 id associations.
     NOTE: no backticks in this file's embedded script — they terminate the
     template literal that carries the whole page. */
  if ((d.fields || []).some(function (f) { return /(^|[a-z])Id$|(^|[a-z])Ids$|(^|_)ref$/.test(f.name); })) {
    h += '<p class="note"><strong>This type carries id-style fields.</strong> ' +
      "The diagram draws containment and generalisation only: a reference held as a string id " +
      "(<code>actorId: z.string()</code>) carries no syntactic link to the schema it names, so it is " +
      "<em>not</em> an absent relation \u2014 it is one this view structurally cannot see.</p>";
  }
  if (d.fields && d.fields.length) {
    h += "<table><caption class=\\"sub\\" style=\\"text-align:left;padding:0 0 4px\\">Fields</caption><thead><tr><th>name</th><th>type</th><th>notes</th></tr></thead><tbody>";
    d.fields.forEach(function (f) {
      h += "<tr><td><code>" + esc(f.name) + (f.optional ? '<span class="opt">?</span>' : "") +
        "</code></td><td><code>" + esc(f.type) + "</code></td><td class=\\"sub\\">" + esc(f.doc || "") + "</td></tr>";
    });
    h += "</tbody></table>";
  }
  if (d.values && d.values.length) {
    h += '<p class="sub">Values</p><p><code>' + d.values.map(esc).join("</code> <code>") + "</code></p>";
  }
  function links(ids) {
    return ids.map(function (i) {
      var t = byId(i);
      return t ? '<a href="#' + encodeURIComponent(i) + '"><code>' + esc(t.name) + "</code></a>" : "<code>" + esc(i) + "</code>";
    }).join(", ");
  }
  if (d.refs && d.refs.length) h += '<p class="sub">References</p><p>' + links(d.refs) + "</p>";
  if (referrers.length) {
    h += '<p class="sub">Referenced by</p><p>' + links([...new Set(referrers.map(function (e) { return e.from; }))]) + "</p>";
  }
  if (d.unresolved && d.unresolved.length) {
    h += '<p class="note">Names bound in this module that resolved to no declaration in the graph: <code>' +
      d.unresolved.map(esc).join("</code> <code>") + "</code></p>";
  }
  $("detail").innerHTML = h;
}

/* ---- Overview -------------------------------------------------------------
   A STATIC picture: the layout is computed once, deterministically, from the
   projection. No simulation, no frame budget, nothing to settle — reload the
   page and every node is where it was. Dragging and re-running a layout are
   deliberately NOT here; they are their own work.

   GRANULARITY IS ADAPTIVE, and that is the whole reason this is readable.
   kg-viewer's skill says not to draw the whole graph, measured on 1111 nodes
   and ~2000 edges rendering as a hairball. That measurement is about the
   KNOWLEDGE graph and does not transfer unexamined: scoped to one instance
   this graph is often nine declarations, where a picture plainly beats a list.
   So the page draws DECLARATIONS while they are few enough to label, and
   MODULES once they are not, with edges aggregated between them. Drawing 812
   labelled boxes would reproduce exactly the hairball that skill warns about. */
var OV_DECL_MAX = 70;

function ovGroupColor(i) {
  /* Fixed hues rather than random: a colour that changes between reloads is a
     legend the reader cannot learn. */
  var hues = [212, 28, 150, 320, 265, 92, 348, 188];
  return "hsl(" + hues[i % hues.length] + " 62% 52%)";
}

function ovModel() {
  var decls = G.decls.filter(inScope);
  var byDecl = decls.length <= OV_DECL_MAX;
  var nodes = [], index = {}, edges = [], internal = 0;

  if (byDecl) {
    decls.forEach(function (d) {
      index[d.id] = nodes.length;
      nodes.push({ id: d.id, label: d.name, group: d.module.split("/").pop(), deg: 0, w: 1 });
    });
    G.edges.forEach(function (e) {
      var a = index[e.from], b = index[e.to];
      if (a === undefined || b === undefined) return;
      if (a === b) { internal++; return; }
      edges.push({ a: a, b: b, w: 1 });
      nodes[a].deg++; nodes[b].deg++;
    });
  } else {
    /* Module mode. A module's node counts the declarations it holds, and an
       edge carries how many declaration references it aggregates, so weight
       is a real count rather than a drawing choice. */
    var mods = {};
    decls.forEach(function (d) {
      var m = d.module;
      if (mods[m] === undefined) {
        mods[m] = nodes.length;
        nodes.push({ id: m, label: m.split("/").pop().replace(/\\.ts$/, ""), group: d.instance, deg: 0, w: 0 });
      }
      nodes[mods[m]].w++;
      index[d.id] = mods[m];
    });
    var seen = {};
    G.edges.forEach(function (e) {
      var a = index[e.from], b = index[e.to];
      if (a === undefined || b === undefined) return;
      /* An edge INSIDE one module has nowhere to go once modules are the
         nodes. It is counted, not dropped: the header says 512 edges and this
         panel would otherwise show ~35 lines with nothing accounting for the
         difference — the same unexplained-count defect the scoped counts
         already fixed once. */
      if (a === b) { internal++; return; }
      var k = a + ":" + b;
      if (seen[k] === undefined) { seen[k] = edges.length; edges.push({ a: a, b: b, w: 0 }); }
      edges[seen[k]].w++;
      nodes[a].deg++; nodes[b].deg++;
    });
  }
  return { nodes: nodes, edges: edges, byDecl: byDecl, declCount: decls.length, internal: internal };
}

function ovLayout(nodes) {
  /* Grouped ring. Nodes are ordered by group, groups by size then name, and
     within a group by degree then id — every tie broken by something stable,
     so the picture is reproducible rather than merely deterministic-looking.
     Hubs sit on the ring like everything else; a chord crossing the middle is
     what makes a hub visible, which is the question the panel exists for. */
  var groups = {}, order = [];
  nodes.forEach(function (n) {
    if (!groups[n.group]) { groups[n.group] = []; order.push(n.group); }
    groups[n.group].push(n);
  });
  order.sort(function (x, y) {
    return groups[y].length - groups[x].length || (x < y ? -1 : x > y ? 1 : 0);
  });
  order.forEach(function (g) {
    groups[g].sort(function (a, b) {
      return b.deg - a.deg || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
  });

  var total = nodes.length;
  var gap = Math.min(0.10, 1.4 / Math.max(1, total));
  var span = 2 * Math.PI - order.length * gap * 2 * Math.PI;
  var seq = [], at = -Math.PI / 2, bands = [];
  order.forEach(function (g, gi) {
    var members = groups[g];
    var arc = span * (members.length / total);
    bands.push({ name: g, from: at, to: at + arc, color: ovGroupColor(gi) });
    members.forEach(function (n, i) {
      var t = members.length === 1 ? at + arc / 2 : at + arc * (i / (members.length - 1));
      n.angle = t; n.color = ovGroupColor(gi);
      seq.push(n);
    });
    at += arc + gap * 2 * Math.PI;
  });
  return bands;
}

function overview() {
  var svg = $("ov-svg");
  var m = ovModel();
  if (!m.nodes.length) {
    $("ov-cap").textContent = "No declarations in scope, so there is nothing to draw.";
    svg.innerHTML = ""; $("ov-key").innerHTML = "";
    return;
  }

  var bands = ovLayout(m.nodes);
  /* The canvas leaves room for the LABELS, not just the ring. Labels are drawn
     radially outside it, so the longest one sets the margin — at 920x560 the
     bottom of the ring ran past the viewBox and names came out clipped. */
  var longest = 0;
  m.nodes.forEach(function (n) { if (n.label.length > longest) longest = n.label.length; });
  var margin = 28 + Math.min(150, longest * 5.4);
  var W = 1180, H = 820, cx = W / 2, cy = H / 2;
  var R = Math.min(W, H) / 2 - margin;
  var maxDeg = 1, maxW = 1;
  m.nodes.forEach(function (n) { if (n.deg > maxDeg) maxDeg = n.deg; if (n.w > maxW) maxW = n.w; });
  m.nodes.forEach(function (n) {
    n.x = cx + R * Math.cos(n.angle);
    n.y = cy + R * Math.sin(n.angle);
    n.r = m.byDecl ? 4 + 5 * Math.sqrt(n.deg / maxDeg) : 4 + 9 * Math.sqrt(n.w / maxW);
  });

  var maxEW = 1;
  m.edges.forEach(function (e) { if (e.w > maxEW) maxEW = e.w; });

  var parts = [];
  /* Edges first, so a node is never hidden behind a line. Each is a quadratic
     curve bent toward the centre: straight chords at this density read as a
     filled disc, and the bend is what keeps bundles apart. */
  m.edges.forEach(function (e) {
    var a = m.nodes[e.a], b = m.nodes[e.b];
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var qx = cx + (mx - cx) * 0.34, qy = cy + (my - cy) * 0.34;
    var sw = m.byDecl ? 1.1 : 0.9 + 3.4 * (e.w / maxEW);
    var op = m.byDecl ? 0.72 : 0.45 + 0.4 * (e.w / maxEW);
    /* Coloured by SOURCE, not by the neutral line colour. The first cut drew
       them in --line (#d9dde2) and the picture answered nothing: a panel whose
       question is "how connected is this" had edges you could not see. Colour
       by source also makes a cross-instance reference legible AS one. */
    parts.push('<path class="ov-e" stroke="' + a.color + '" d="M' + a.x.toFixed(1) + " " + a.y.toFixed(1) +
      "Q" + qx.toFixed(1) + " " + qy.toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1) +
      '" stroke-width="' + sw.toFixed(2) + '" stroke-opacity="' + op.toFixed(2) + '"/>');
  });

  /* Group arcs, labelled outside the ring, so the ordering is legible as
     grouping rather than as an arbitrary sequence. */
  bands.forEach(function (b) {
    var mid = (b.from + b.to) / 2, lr = R + (m.byDecl ? 74 : 52);
    var lx = cx + lr * Math.cos(mid), ly = cy + lr * Math.sin(mid);
    var anchor = Math.cos(mid) > 0.15 ? "start" : Math.cos(mid) < -0.15 ? "end" : "middle";
    parts.push('<path class="ov-band" stroke="' + b.color + '" d="M' +
      (cx + (R + 12) * Math.cos(b.from)).toFixed(1) + " " + (cy + (R + 12) * Math.sin(b.from)).toFixed(1) +
      "A" + (R + 12) + " " + (R + 12) + " 0 " + ((b.to - b.from) > Math.PI ? 1 : 0) + " 1 " +
      (cx + (R + 12) * Math.cos(b.to)).toFixed(1) + " " + (cy + (R + 12) * Math.sin(b.to)).toFixed(1) + '"/>');
    parts.push('<text class="ov-g" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) +
      '" text-anchor="' + anchor + '" dominant-baseline="middle">' + esc(b.name) + "</text>");
  });

  m.nodes.forEach(function (n) {
    parts.push('<circle class="ov-n" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) +
      '" r="' + n.r.toFixed(1) + '" fill="' + n.color + '" data-ov="' + esc(n.id) + '"><title>' +
      esc(n.label) + " \\u2014 " + (m.byDecl ? n.deg + " edge(s)" : n.w + " declaration(s), " + n.deg + " reference(s)") +
      "</title></circle>");
    /* Label only what can be read. In module mode everything is labelled; in
       declaration mode the ring is denser, so the long tail is left to the
       tooltip rather than overplotted into illegibility. */
    if (!m.byDecl || n.deg > 0 || m.nodes.length <= 40) {
      var lr = R + n.r + 6, a = n.angle;
      var lx = cx + lr * Math.cos(a), ly = cy + lr * Math.sin(a);
      var flip = Math.cos(a) < 0;
      var deg = (a * 180) / Math.PI + (flip ? 180 : 0);
      parts.push('<text class="ov-t" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) +
        '" text-anchor="' + (flip ? "end" : "start") + '" dominant-baseline="middle" transform="rotate(' +
        deg.toFixed(1) + " " + lx.toFixed(1) + " " + ly.toFixed(1) + ')">' + esc(n.label) + "</text>");
    }
  });

  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.innerHTML = parts.join("");

  var orphans = m.nodes.filter(function (n) { return n.deg === 0; }).length;
  $("ov-cap").innerHTML = m.byDecl
    ? "<b>" + m.nodes.length + "</b> declarations, <b>" + m.edges.length +
      "</b> edges between them, grouped by module. Node size is degree." +
      (m.internal ? " <b>" + m.internal + "</b> self-reference(s) not drawn." : "") +
      (orphans ? " <b>" + orphans + "</b> reference nothing and are referenced by nothing here." : "")
    : "<b>" + m.declCount + "</b> declarations are too many to label, so this draws the <b>" + m.nodes.length +
      "</b> <b>modules</b> holding them, grouped by instance. Node size is declarations held; " +
      "line weight is how many references the edge aggregates." +
      (m.internal ? " <b>" + m.internal + "</b> edge(s) run WITHIN a single module and so have nowhere to be drawn \u2014 " +
        "counted here rather than dropped, because the difference from the graph-wide total is otherwise unexplained." : "") +
      (orphans ? " <b>" + orphans + "</b> module(s) neither reference nor are referenced." : "");

  $("ov-key").innerHTML = bands.map(function (b) {
    return '<span><i style="background:' + b.color + '"></i>' + esc(b.name) + "</span>";
  }).join("");
}

function render() {
  var q = $("q").value.trim().toLowerCase();
  var k = $("kind").value, m = $("mod").value;
  var rows = G.decls.filter(function (d) {
    if (!inScope(d)) return false;
    if (k && d.kind !== k) return false;
    if (m && d.module !== m) return false;
    if (!q) return true;
    return (d.name + " " + d.module + " " + (d.doc || "")).toLowerCase().indexOf(q) >= 0;
  });
  $("items").innerHTML = rows.slice(0, 400).map(function (d) {
    return '<li><button type="button" data-id="' + esc(d.id) + '" aria-current="' + (SEL === d.id) + '">' +
      '<span class="nm">' + esc(d.name) + "</span>" +
      (d.kind === "undetermined" ? '<span class="tag warn">undetermined</span>' : '<span class="tag">' + esc(d.kind) + "</span>") +
      '<br><span class="sub">' + esc(d.module.split("/").pop()) + "</span></li>";
  }).join("") || '<li><p class="empty">Nothing matches.</p></li>';
  $("counts").textContent = "";
  var scoped = G.decls.filter(inScope);
  var mods = G.modules.filter(function (m) { return !SCOPE || m.instance === SCOPE; });
  /* Edges are scoped too. Reporting the graph-wide 512 on a page showing 9
     declarations says there are 512 edges among those 9, which is a claim the
     page does not support. An edge COUNTS here when it leaves a declaration
     this page shows — edges INTO the subject from elsewhere are real and are
     still followable from the detail panel, they are just not this subject's
     own outgoing structure. */
  var edgeCount = SCOPE
    ? G.edges.filter(function (e) { var f = G.declIndex[e.from]; return f && inScope(f); }).length
    : G.edges.length;
  $("counts").innerHTML = (SCOPE ? "<b>" + SCOPE + "</b> &middot; " : "") +
    "<b>" + rows.length + "</b> of <b>" + scoped.length + "</b> declarations &middot; <b>" +
    mods.length + "</b> modules &middot; <b>" + edgeCount + "</b> edges &middot; <b>" +
    scoped.filter(function (d) { return d.kind === "undetermined"; }).length + "</b> undetermined";
}

function select(id) {
  var d = byId(id);
  if (!d) return;
  SEL = id;
  if (location.hash.slice(1) !== encodeURIComponent(id)) {
    try { history.replaceState(null, "", "#" + encodeURIComponent(id)); } catch (e) { /* opened from a file */ }
  }
  render();
  detail(d);
}

fetch(DATA_HREF).then(function (r) {
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}).then(function (data) {
  G = data;
  G.declIndex = {};
  G.decls.forEach(function (d) { G.declIndex[d.id] = d; });
  // A declaration names its module; the module names its instance. Joined
  // here once rather than at each filter, so the scope test stays O(1).
  var instOf = {};
  G.modules.forEach(function (m) { instOf[m.module] = m.instance; });
  G.decls.forEach(function (d) { d.instance = instOf[d.module]; });
  var kinds = [...new Set(G.decls.map(function (d) { return d.kind; }))].sort();
  kinds.forEach(function (k) {
    var o = document.createElement("option"); o.value = k; o.textContent = k; $("kind").appendChild(o);
  });
  var withDecls = {};
  G.decls.forEach(function (d) { withDecls[d.module] = true; });
  /* Labelled with the instance, because four of them declare a schemas graph
     and module names repeat across them — two entries both reading "types"
     are indistinguishable in the list even though their values differ. */
  var nameCount = {};
  G.modules.forEach(function (m) { nameCount[m.name] = (nameCount[m.name] || 0) + 1; });
  G.modules.forEach(function (m) {
    if (!withDecls[m.module]) return;
    if (SCOPE && m.instance !== SCOPE) return;
    var o = document.createElement("option");
    o.value = m.module;
    o.textContent = nameCount[m.name] > 1 ? m.instance + " / " + m.name : m.name;
    $("mod").appendChild(o);
  });
  $("q").addEventListener("input", render);
  $("kind").addEventListener("change", render);
  $("mod").addEventListener("change", render);
  $("items").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]");
    if (b) select(b.getAttribute("data-id"));
  });
  /* A node navigates; it does not move. In declaration mode it selects, in
     module mode it filters the list to that module — the overview hands you
     off to the panel that answers the local question. */
  $("ov-svg").addEventListener("click", function (e) {
    var c = e.target.closest("[data-ov]");
    if (!c) return;
    var id = c.getAttribute("data-ov");
    if (byId(id)) { select(id); return; }
    $("mod").value = id;
    render();
    $("list").scrollIntoView({ block: "start" });
  });
  $("overview").addEventListener("toggle", function () {
    /* Drawn on first open rather than at load: a reader who never opens the
       panel should not pay for a layout over 812 declarations. */
    if ($("overview").open && !$("ov-svg").childNodes.length) overview();
  });
  $("detail").addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a) { e.preventDefault(); select(decodeURIComponent(a.getAttribute("href").slice(1))); }
  });
  render();
  if (location.hash.length > 1) select(decodeURIComponent(location.hash.slice(1)));
}).catch(function (e) {
  $("counts").textContent = "could not load the projection: " + e.message;
  $("detail").innerHTML = '<p class="empty">The projection at <code>' + esc(DATA_HREF) + '</code> could not be read. ' +
    "That is not an empty graph \\u2014 it is a graph that could not be loaded, and the page says so rather than showing nothing.</p>";
});
</script>
</body>
</html>
`;
}

/** Write, or report staleness. Same contract as `gen-docs-pages.ts`. */
let stale = 0;
function emit(path: string, content: string): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === content) return;
    console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
    stale++;
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ ${path}`);
}

if (import.meta.main) {
  const g = readSchemaGraph(ROOT);
  if (g === null) {
    // No schemas directory is not an empty graph. A folio without one simply
    // gets no projection, and the viewer reads the absent file as "could not
    // load" rather than as "there is nothing".
    console.log("  · no schemas directory — nothing to publish");
    process.exit(0);
  }
  const site = join(ROOT, siteDirFor(ROOT));
  /**
   * The published segment is the DECLARED directory's own name, read rather
   * than written down.
   *
   * `check:declared-paths` caught the first draft writing `"schemas"` as a
   * literal here, and it was right to: that is a second answer to a question
   * `harness.json` already answers, and the moment the directory is renamed
   * the source moves and the URL does not. Taking the basename of the
   * resolved directory means one fact — where the schema graph lives — serves
   * both the read and the publish.
   *
   * It also generalises, which is the point: a visualiser for any declared
   * subgraph publishes under THAT subgraph's declared name, with no per-graph
   * literal anywhere. That is what `2krx` would need if all 19 unrendered
   * subgraphs get viewers.
   */
  /**
   * This instance's OWN schemas directory decides the segment.
   *
   * Four instances declare one, and `schemaRoots` returns all four — a
   * dependency's directory must not name the URL this instance publishes at.
   * So the one inside ROOT wins, and the first declared one is the fallback
   * for an instance that declares none of its own.
   *
   * On the wider URL shape: the owner ruled on `o7eq` that a rendered asset's
   * address is the instance's NAME plus the declared graph as a segment, with
   * whether the ROOT instance elides its own name still open and recommended
   * to elide. This publishes at `<site>/<graph>/`, which is that ruling with
   * the root eliding — so it needs no change if the recommendation stands,
   * and one segment if it does not. `8325` tracks it either way.
   */
  const ownPrefix = `${ROOT}${sep}`;
  const roots = schemaRoots(ROOT);
  const own = roots.find((d) => d.startsWith(ownPrefix)) ?? roots[0];
  if (own === undefined) {
    console.log("  · no schemas directory is declared — nothing to publish");
    process.exit(0);
  }
  const seg = basename(own);
  const data = JSON.stringify(projection(g), null, 2) + "\n";
  // Indented for the reason the todo and bean indices both document: a
  // minified projection is one line, git merges by line, and two branches each
  // adding a schema would conflict on the whole file every time.
  // ── Rule 1: a HANDLER rendering a kind's assets ────────────────────────
  //
  // `<base>/<handler>/<kind>/<optional subject>` — the owner's own example is
  // `<base>/cat-harness/docs/who-iris/`. The handler is THIS instance, the
  // kind names what it renders, the subject scopes it to one instance.
  //
  // Rule 2, `<base>/<instance>/`, is the instance presenting ITSELF, and a
  // subject page must never be published there: it would squat on that
  // instance's own site.
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }
  const { pageDir, dataDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, seg);
  emit(join(dataDir, "index.json"), data);
  emit(join(pageDir, "index.html"), viewerHtml(dataHref));

  // One page per SUBJECT — read from the modules actually found, so a
  // declared-but-empty directory gets no page claiming to show it.
  const subjects = [...new Set(g.modules.map((m) => m.instance))].sort();
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, seg);
    emit(join(sub.pageDir, "index.html"), viewerHtml(sub.dataHref, subject));
  }

  if (!check) {
    console.log(
      `  ${g.modules.length} module(s), ${g.decls.length} declaration(s), ${g.edges.length} edge(s), ` +
        `${g.decls.filter((d) => d.kind === "undetermined").length} undetermined; ` +
        `${subjects.length} subject page(s); ` +
        `projection ${(Buffer.byteLength(data) / 1024).toFixed(0)} KB`,
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run schema:viz\``);
    process.exit(1);
  }
}
