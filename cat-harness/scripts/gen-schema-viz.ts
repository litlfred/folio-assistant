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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";

import { readSchemaGraph, schemaRoots, type SchemaGraph } from "./schema-graph.ts";
import { readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { directoryByVisualisationRef } from "./graph-tiles.ts";
// The `folio` graph kind is registered by CORE on import; this module resolves
// this instance's directories and the instance declares a folio graph.
import "../schemas/folio-graph-kind.js";
import { tileCounts } from "../schemas/tile-count.js";

const ROOT = join(import.meta.dir, "..");
const REPO_ROOT = repoRootFor(ROOT);
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
function projection(
  g: SchemaGraph,
  /** Subject-page counts, `directory id -> [count, unit]`. Empty is normal. */
  scoped: Readonly<Record<string, readonly [number, string]>>,
): unknown {
  return {
    $schema: "folio-schema-graph/v1",
    // EVERY count here is computed for the PAGE A TILE OPENS, and there is
    // deliberately no whole-graph entry.
    //
    // #863 found the reason the hard way. This generator first declared
    // `schemas: [g.modules.length]` — the whole graph, 139 modules. But the
    // `schemas` directory declares its visualiser as
    // `.../schemas/cat-harness/index.html`, the cat-harness-SCOPED page,
    // which lists 122. So the badge read the graph while the page read a
    // subset, and it shipped that way in #862.
    //
    // A whole-graph number is not "close enough" to a scoped page's: it is a
    // second answer to the question the tile appears to be answering, which is
    // `flh4` in the one place this feature was built to prevent it. Deriving
    // every count from the declared ref makes the class unreachable rather
    // than merely fixed — a tile cannot disagree with its page when the count
    // was computed FOR that page.
    //
    // `modules`, not `decls`, of the four numbers this graph holds: it is the
    // first the run's own summary prints, so the tile and the console agree.
    // `decls` is a number PER module and a tile reading 842 over a page
    // listing 122 rows is the disagreement a badge exists to surface.
    ...tileCounts(scoped),
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

/* `orphanSubjectPages` MOVED to `./orphan-pages.ts` (bean `s8nu`).
 *
 * It was the third of four selectors answering "did this generator write this
 * page, here?", and the bean's finding was that the multiplicity is the
 * defect. It is re-exported from here because `gen-library-viz.ts`,
 * `gen-docs-auto.ts` and the tests already import it from this module, and a
 * re-export keeps that a one-line change rather than a sweep.
 *
 * The leaf also exists so `state-visualizer.ts` can be a call site WITHOUT
 * importing this module, which is a 1200-line page generator whose whole body
 * is one template literal. Same move #840 made for the graph-kind registry,
 * and for the same reason: a consumer should not have to load a page builder
 * to ask an ownership question. */
import { orphanSubjectPages } from "./orphan-pages.ts";

export { orphanSubjectPages, declaresItsOwnDirectory, carriesMarker } from "./orphan-pages.ts";
export type { OwnershipTest } from "./orphan-pages.ts";

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
.dia-e { fill: none; stroke-width: 1.6; }
.dia-field { stroke: var(--accent); }
.dia-gen { stroke: var(--fg); }
/* Dashed, and a different colour, because an id-ref is DECLARED rather than
   found in the source. Drawing it like a field reference would claim the
   reader saw something it structurally cannot see. */
.dia-idref { stroke: var(--warn); }
.dia-genhead { fill: var(--bg); stroke: var(--fg); stroke-width: 1.4; }
.dia-refhead { fill: none; stroke: var(--accent); stroke-width: 1.5; }
.dia-l { fill: var(--fg); font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; }
.dia-lb { fill: var(--panel); stroke: var(--line); stroke-width: .8; }
.dia-n { cursor: pointer; }
.dia-n:hover .uml-box { stroke: var(--accent); stroke-width: 2; }
/* Context boxes are faded, never hidden: they are real declarations the page
   is not about, and a link into one is the edge a strict filter would cut. */
.dia-ctx { opacity: .55; }
.dia-ctx .uml-box { stroke-dasharray: 4 3; }
.ov-key { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 10px 0 0; font-size: .78rem; color: var(--muted); }
.ov-key span { display: inline-flex; align-items: center; gap: 6px; }
.ov-key i { display: inline-block; }
.ov-key i.k-gen { width: 16px; height: 0; border-top: 2px solid var(--fg); border-radius: 0; }
.ov-key i.k-field { width: 16px; height: 0; border-top: 2px solid var(--accent); border-radius: 0; }
.ov-key i.k-idref { width: 16px; height: 0; border-top: 2px dashed var(--warn); border-radius: 0; }
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
  <summary>Relationship diagram &mdash; what is defined here, and how it is linked</summary>
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

/* ---- Relationship diagram -------------------------------------------------
   UML class boxes wired by their edges, so a reader can see that Role is
   linked to Skill AND HOW — the label on the edge is the field it goes
   through. This is the panel's whole reason to exist; a picture that shows
   connection without naming the relation answers half the question.

   SCOPED, NEVER THE WHOLE CORPUS. Owner, 2026-09-20: "not the WHOLE thing"
   and "what's defined in that KG harness". 812 labelled boxes is the hairball
   kg-viewer measured at 1111 nodes, so the diagram draws what the page is
   scoped to, narrowed further by the module filter when one is set — which is
   how a 754-declaration instance still has a readable picture.

   The layout is STATIC: computed once, deterministically, no simulation.
   Dragging and alternate arrangements are bean whbf. */
var DIA_MAX = 40;

/** Edge styling per kind — and an id-ref is deliberately not drawn like the rest. */
function diaEdgeStyle(kind) {
  if (kind === "extends") return { dash: "", head: "gen", cls: "dia-gen", label: "" };
  /* DECLARED, not proven. A field reference is in the source; an id-ref is an
     author's assertion via @ref over a plain string. Drawing them alike would
     claim the reader found something it cannot see. */
  if (kind === "id-ref") return { dash: "5 4", head: "ref", cls: "dia-idref", label: "" };
  return { dash: "", head: "ref", cls: "dia-field", label: "" };
}

var DIA_CONTEXT_MAX = 12;

/* WIDTH BUDGET, in viewBox units (bean qttr).
   Without one, a layer is placed as a single row and the viewBox grows with
   it, so the SVG scales the whole picture down to fit its container --
   silently, because an SVG that does not fit does not complain. Measured
   across all 67 modules of this graph: dak-blocks.ts came out 5476 units
   wide against 1248 CSS px, a scale of 0.228, which renders a 10px font at
   2.3px. Twelve modules were below a 5px effective glyph.
   The budget is the PANEL'S OWN WIDTH, so the rendered scale lands at 1:1
   rather than under it, and a narrow reader gets a tall legible picture
   instead of a wide illegible one. A fixed budget cannot do that: 1100 units
   is 1:1 on a laptop and 0.36 on a phone.
   This makes wrapping depend on the viewport, which is deliberate and does
   not cost reproducibility -- the ORDER within a layer is what has to be
   stable, and it is untouched.
   There is deliberately NO FLOOR. A floor was tried at 560 and measured: at a
   390px viewport it left 49 of 69 modules below a 5px glyph, because the
   floor rather than the page was setting the width. Taking the panel's width
   whatever it is degrades to one box per row on a phone -- tall, but legible,
   which is the trade worth making for a panel a reader opened in order to
   read. The band loop already gives an over-budget box a row of its own, so
   no width is degenerate. */
function diaWidth(svg) {
  /* A collapsed details panel measures 0, and so does a detached node. The
     fallback is only ever used for a layout that is about to be redone on
     open, so it need only be sane. */
  return svg.getBoundingClientRect().width || 900;
}

/* THE LIST AND THE PICTURE FILTER THROUGH ONE PREDICATE, and that is the
   point of this function existing rather than each caller writing its own.
   They drifted precisely because there were two: render() honoured search,
   kind and module while diaModel() honoured module alone, so a reader who
   typed into the search box narrowed the list and the diagram did not move.
   Nothing on the page said why, which makes a deliberate choice and a bug
   look identical to the person looking at them. */
function matchesFilter(d, q, k, m) {
  if (!inScope(d)) return false;
  if (k && d.kind !== k) return false;
  if (m && d.module !== m) return false;
  if (!q) return true;
  return (d.name + " " + d.module + " " + (d.doc || "")).toLowerCase().indexOf(q) >= 0;
}

/** The three filter controls, read once so every caller sees one state. */
function filterState() {
  return {
    q: $("q") ? $("q").value.trim().toLowerCase() : "",
    k: $("kind") ? $("kind").value : "",
    m: $("mod") ? $("mod").value : "",
  };
}

function diaModel() {
  var f = filterState();
  var mod = f.m;
  var core = G.decls.filter(function (d) { return matchesFilter(d, f.q, f.k, f.m); });
  var index = {}, decls = [];
  core.forEach(function (d) { index[d.id] = decls.length; decls.push(d); d.__ctx = false; });

  /* ONE HOP OF CONTEXT, and it is not a nicety.
     The relationship worth seeing is usually the one that LEAVES the module:
     RoleDefSchema --skills--> SkillDefinitionSchema lives in two files, so a
     strict module filter draws Role with its most interesting edge cut and
     reports the loss as a number. Counting an edge is not showing it. So a
     declaration just outside the filter that a drawn one touches is drawn
     too, marked as context rather than as part of the set. */
  var ctxIds = {};
  G.edges.forEach(function (e) {
    var fi = index[e.from], ti = index[e.to];
    if (fi !== undefined && ti === undefined) ctxIds[e.to] = true;
    else if (ti !== undefined && fi === undefined) ctxIds[e.from] = true;
  });
  var ctx = Object.keys(ctxIds)
    .map(function (id) { return G.declIndex[id]; })
    .filter(Boolean)
    .sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  var ctxShown = ctx.slice(0, DIA_CONTEXT_MAX);
  ctxShown.forEach(function (d) { index[d.id] = decls.length; decls.push(d); d.__ctx = true; });

  var edges = [], ctxEdges = 0;
  G.edges.forEach(function (e) {
    var a = index[e.from], b = index[e.to];
    if (a === undefined || b === undefined || a === b) return;
    /* Context-to-context would draw a graph the page is not about -- but BOTH
       boxes are on screen, so a reader sees two declarations with no line and
       has no way to know a relationship was suppressed rather than absent.
       Counted, not dropped: the same contract the module-aggregation count
       used to carry before the layered diagram replaced it, and the reason
       this bean's own closing line requires the report survive every mode.
       Measured when this was added, over the COMMITTED projection of 842
       declarations and 525 edges: 15 summed across the 79 module filters,
       and 0 across eight sample searches -- so it is a SMALL loss, and the
       reason to report it is that it is INVISIBLE, not that it is large. An
       earlier draft of this comment claimed a tighter filter makes more of
       them; that was asserted, then measured, and it is false. The figures
       move as the corpus does; the contract does not. */
    if (decls[a].__ctx && decls[b].__ctx) { ctxEdges++; return; }
    edges.push({ a: a, b: b, via: e.via, kind: e.kind, array: e.array, optional: e.optional });
  });
  return {
    decls: decls,
    edges: edges,
    index: index,
    mod: mod,
    coreCount: core.length,
    ctxShown: ctxShown.length,
    ctxHidden: ctx.length - ctxShown.length,
    ctxEdges: ctxEdges,
    /* Whether any filter is NARROWING the picture, so an empty result can say
       which. Module is included: it empties the set the same way. */
    filtered: !!(f.q || f.k || f.m),
  };
}

/** Longest-path layering, then one barycentre pass to reduce crossings. */
function diaLayout(m) {
  var n = m.decls.length;
  var out = [], inc = [];
  for (var i = 0; i < n; i++) { out.push([]); inc.push([]); }
  m.edges.forEach(function (e) { out[e.a].push(e.b); inc[e.b].push(e.a); });

  /* A generalisation should read DOWNWARD from its parent, so layer by
     longest path over incoming edges. Cycles are real in a schema graph
     (mutually recursive types), so the walk is depth-capped rather than
     assuming a DAG — a cycle settles instead of hanging. */
  var layer = new Array(n).fill(0);
  for (var pass = 0; pass < Math.min(n, 12); pass++) {
    var moved = false;
    for (var v = 0; v < n; v++) {
      inc[v].forEach(function (u) {
        if (layer[u] + 1 > layer[v]) { layer[v] = layer[u] + 1; moved = true; }
      });
    }
    if (!moved) break;
  }

  var rows = {};
  for (var k = 0; k < n; k++) { (rows[layer[k]] = rows[layer[k]] || []).push(k); }
  var keys = Object.keys(rows).map(Number).sort(function (x, y) { return x - y; });
  /* Stable within a layer: barycentre of the layer above, ties by name, so the
     picture is reproducible rather than merely deterministic-looking. */
  keys.forEach(function (ky) {
    rows[ky].sort(function (x, y) {
      var bx = inc[x].length ? inc[x].reduce(function (s, u) { return s + u; }, 0) / inc[x].length : 1e9;
      var by = inc[y].length ? inc[y].reduce(function (s, u) { return s + u; }, 0) / inc[y].length : 1e9;
      return bx - by || (m.decls[x].name < m.decls[y].name ? -1 : 1);
    });
  });
  return { rows: rows, keys: keys, layer: layer };
}

function diagram() {
  var svg = $("ov-svg"), cap = $("ov-cap"), key = $("ov-key");
  var m = diaModel();

  if (!m.decls.length) {
    /* NAME THE CAUSE. This said "Nothing in scope to draw" while only scope
       and the module select could empty it, and that was true then. Once the
       search and kind filters narrow the picture too, the same words blame
       the SUBJECT for what a filter did, and a reader who typed a word that
       matches nothing is told the page is empty. */
    var why = m.filtered
      ? "No declaration matches the filters above, so there is nothing to draw. Clear the search or the kind to get the picture back."
      : "Nothing in scope to draw.";
    cap.textContent = why;
    svg.innerHTML = ""; key.innerHTML = "";
    return;
  }
  if (m.coreCount > DIA_MAX) {
    /* Refusing is the honest answer, and it says how to get a picture rather
       than just declining. Drawing 754 labelled boxes is the hairball. */
    svg.innerHTML = ""; key.innerHTML = "";
    cap.innerHTML = "<b>" + m.decls.length + "</b> declarations in scope — too many to draw as a relationship diagram " +
      "(the limit is <b>" + DIA_MAX + "</b>, above which labelled boxes stop being readable). " +
      "Pick a <b>module</b> in the filter above and the diagram for it appears here.";
    return;
  }

  var L = diaLayout(m);
  var CH = 7.0, PAD = 10, LH = 15, HEAD = 22, GAPX = 46, GAPY = 96;

  /* Boxes first, to know their sizes before placing anything. */
  var boxes = m.decls.map(function (d) {
    var fields = (d.fields || []).map(function (f) {
      return f.name + (f.optional ? "?" : "") + ": " + f.type.replace(/^z\./, "").slice(0, 24);
    });
    var rows = fields.slice(0, 6);
    if (fields.length > rows.length) rows = rows.concat(["… " + (fields.length - rows.length) + " more"]);
    var w = Math.max(d.name.length, 10);
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    w = Math.min(w, 34) * CH + PAD * 2;
    return { d: d, rows: rows, w: w, h: HEAD + (rows.length ? rows.length * LH + 6 : 0) };
  });

  /* A layer becomes one or more BANDS, each within the width budget. Wrapping keeps
     a layer's members in their own stretch of the picture, so layer-as-depth
     still reads; it only stops the row running off the side. Order within the
     layer is untouched, so the arrangement stays reproducible. */
  var budget = diaWidth(svg);
  var bands = [];
  L.keys.forEach(function (ky) {
    var row = L.rows[ky], cur = [], w = 0;
    row.forEach(function (i) {
      var bw = boxes[i].w;
      if (cur.length && w + GAPX + bw > budget) { bands.push({ ky: ky, row: cur }); cur = []; w = 0; }
      w += (cur.length ? GAPX : 0) + bw;
      cur.push(i);
    });
    /* A single box wider than the budget still gets a band of its own rather
       than being dropped. Unreachable at today's 258-unit cap, and a visibly
       oversized band is a better failure than a missing declaration. */
    if (cur.length) bands.push({ ky: ky, row: cur });
  });
  var wrapped = bands.length - L.keys.length;

  var y = 20, W = 0;
  bands.forEach(function (b, bi) {
    b.rw = b.row.reduce(function (s, i) { return s + boxes[i].w; }, 0) + GAPX * (b.row.length - 1);
    var x = 20, hmax = 0;
    b.row.forEach(function (i) {
      boxes[i].x = x; boxes[i].y = y;
      x += boxes[i].w + GAPX;
      if (boxes[i].h > hmax) hmax = boxes[i].h;
    });
    W = Math.max(W, b.rw + 40);
    /* Tighter between bands of ONE layer than between layers: the gap is what
       tells a reader the two rows are the same depth rather than two. */
    var same = bands[bi + 1] && bands[bi + 1].ky === b.ky;
    y += hmax + (same ? 30 : GAPY);
  });
  var H = y;

  /* Centre each band, now that the widest is known. */
  bands.forEach(function (b) {
    var off = (W - b.rw) / 2 - 20;
    b.row.forEach(function (i) { boxes[i].x += off; });
  });

  var parts = [
    '<defs>' +
    '<marker id="dia-gen" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">' +
    '<path d="M0 0 L12 6 L0 12 z" class="dia-genhead"/></marker>' +
    '<marker id="dia-ref" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
    '<path d="M0 0 L10 5 L0 10" class="dia-refhead"/></marker>' +
    "</defs>",
  ];

  var crowded = 0;
  m.edges.forEach(function (e, ei) {
    var a = boxes[e.a], b = boxes[e.b];
    var ax = a.x + a.w / 2, bx = b.x + b.w / 2;
    var ay, by;
    if (b.y >= a.y + a.h) { ay = a.y + a.h; by = b.y; }
    else if (a.y >= b.y + b.h) { ay = a.y; by = b.y + b.h; }
    else { ay = a.y + a.h / 2; by = b.y + b.h / 2; }
    var my = (ay + by) / 2;
    var st = diaEdgeStyle(e.kind);
    parts.push('<path class="dia-e ' + st.cls + '" d="M' + ax.toFixed(1) + " " + ay.toFixed(1) +
      "C" + ax.toFixed(1) + " " + my.toFixed(1) + " " + bx.toFixed(1) + " " + my.toFixed(1) + " " +
      bx.toFixed(1) + " " + by.toFixed(1) + '"' + (st.dash ? ' stroke-dasharray="' + st.dash + '"' : "") +
      ' marker-end="url(#dia-' + st.head + ')"/>');
    /* THE LABEL IS THE POINT. "Role is linked to Skill" is half an answer;
       "via skills, many" is the whole one. */
    if (e.via) {
      /* Two edges whose midpoints land in the same band overplot their
         labels, which is how "permissions * 0..1" and "actors * 0..1" came
         out on top of each other. Stagger by index: deterministic, and it
         only has to separate neighbours rather than be optimal. */
      var lx = (ax + bx) / 2, ly = my + ((ei % 3) - 1) * 13;
      var txt = e.via + (e.array ? " *" : "") + (e.optional ? " 0..1" : "");
      /* A label that lands ON a box (bean qttr). Boxes are painted after the
         edges, so an opaque one hides the label -- but a CONTEXT box is
         faded, and the label then shows through its fields as overstruck
         text. Narrow layouts made this common rather than rare: one box per
         row means a near-vertical edge whose midpoint is the next box.
         Push clear of the offender rather than dropping the label, because
         the label is the whole point of the edge -- "Role is linked to
         Skill" is half an answer, "via skills, many" is the whole one. */
      var half = txt.length * 3.3 + 5;
      var blocker = function (cx, cy) {
        for (var q = 0; q < boxes.length; q++) {
          var bq = boxes[q];
          if (cx + half > bq.x && cx - half < bq.x + bq.w && cy + 8 > bq.y && cy - 8 < bq.y + bq.h) return bq;
        }
        return null;
      };
      /* Candidates in order of preference, first clear one wins. One pass of
         push-aside was not enough: measured over this graph it left 28 of 323
         labels still on a box, because pushing clear of one lands on the
         next. Deterministic -- the same edge in the same layout always picks
         the same candidate. */
      var hit = blocker(lx, ly);
      if (hit) {
        var cands = [
          [hit.x + hit.w + half + 6, ly],
          [hit.x - half - 6, ly],
          [(ax + bx) / 2, ay + 11],
          [(ax + bx) / 2, by - 11],
          [hit.x + hit.w + half + 6, ay + 11],
          [hit.x - half - 6, by - 11],
        ];
        for (var ci = 0; ci < cands.length; ci++) {
          if (cands[ci][0] - half < 0 || cands[ci][0] + half > W) continue;
          if (!blocker(cands[ci][0], cands[ci][1])) { lx = cands[ci][0]; ly = cands[ci][1]; hit = null; break; }
        }
        /* Still nowhere clear. Counted and reported rather than silently
           overstruck or silently dropped -- an edge whose field a reader
           cannot read is the same loss the undrawn-edge count exists for. */
        if (hit) crowded++;
      }
      parts.push('<rect class="dia-lb" x="' + (lx - half).toFixed(1) + '" y="' + (ly - 8).toFixed(1) +
        '" width="' + (half * 2).toFixed(1) + '" height="15" rx="3"/>');
      parts.push('<text class="dia-l" x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) +
        '" text-anchor="middle">' + esc(txt) + "</text>");
    }
  });

  boxes.forEach(function (bx) {
    var d = bx.d;
    var g = '<g class="dia-n' + (d.__ctx ? " dia-ctx" : "") + '" data-ov="' + esc(d.id) + '"><title>' +
      esc(d.name) + " — " + esc(d.kind) +
      (d.__ctx ? ". OUTSIDE this filter — drawn because something here links to it." : "") +
      ". Click to open its definition.</title>" +
      '<rect class="uml-box' + (SEL === d.id ? " sel" : "") + '" x="' + bx.x.toFixed(1) + '" y="' + bx.y.toFixed(1) +
      '" width="' + bx.w.toFixed(1) + '" height="' + bx.h.toFixed(1) + '" rx="4"/>' +
      '<text class="uml-t" x="' + (bx.x + PAD).toFixed(1) + '" y="' + (bx.y + 15).toFixed(1) + '">' +
      esc(d.name.slice(0, 34)) + "</text>";
    if (bx.rows.length) {
      g += '<line class="uml-e" x1="' + bx.x.toFixed(1) + '" y1="' + (bx.y + HEAD).toFixed(1) +
        '" x2="' + (bx.x + bx.w).toFixed(1) + '" y2="' + (bx.y + HEAD).toFixed(1) + '"/>';
      bx.rows.forEach(function (r, i) {
        g += '<text class="uml-f" x="' + (bx.x + PAD).toFixed(1) + '" y="' +
          (bx.y + HEAD + 14 + i * LH).toFixed(1) + '">' + esc(r.slice(0, 34)) + "</text>";
      });
    }
    parts.push(g + "</g>");
  });

  svg.setAttribute("viewBox", "0 0 " + Math.max(W, 320) + " " + H);
  svg.innerHTML = parts.join("");

  var kinds = {};
  m.edges.forEach(function (e) { kinds[e.kind] = (kinds[e.kind] || 0) + 1; });
  cap.innerHTML = "<b>" + m.coreCount + "</b> declaration(s)" +
    (m.mod ? " in <b>" + esc(m.mod.split("/").pop()) + "</b>" : SCOPE ? " in <b>" + esc(SCOPE) + "</b>" : "") +
    ", <b>" + m.edges.length + "</b> relationship(s). Each edge is labelled with the FIELD it goes " +
    "through; <b>*</b> is a list. Click a box to open its definition." +
    (m.ctxShown ? " <b>" + m.ctxShown + "</b> faded box(es) sit OUTSIDE this filter and are drawn because " +
      "something here links to them \u2014 a cut edge is the one most worth seeing." : "") +
    (m.ctxHidden ? " <b>" + m.ctxHidden + "</b> further neighbour(s) not drawn." : "") +
    /* Both endpoints ARE drawn, so an unreported suppression reads as "these
       two are unrelated" -- a false statement the picture makes silently. */
    (m.ctxEdges ? " <b>" + m.ctxEdges + "</b> relationship(s) BETWEEN two faded boxes are not drawn, because " +
      "the picture is about this filter rather than about its surroundings \u2014 counted here so a missing " +
      "line is never mistaken for a missing relationship." : "") +
    /* Said rather than left to be noticed: a wrapped layer looks like two
       layers to a reader who was not told, and the alternative the panel used
       to take was to shrink the whole picture without saying so. */
    (wrapped ? " <b>" + wrapped + "</b> row(s) wrapped to keep the boxes at full size." : "") +
    (crowded ? " <b>" + crowded + "</b> label(s) had nowhere clear to sit and overlap a box \u2014 hover the edge's boxes to read the field." : "");

  key.innerHTML =
    '<span><i class="k-gen"></i>generalisation (extends)</span>' +
    '<span><i class="k-field"></i>field reference — in the source</span>' +
    '<span><i class="k-idref"></i>id reference — DECLARED with @ref, because a string id is invisible to a syntactic reader</span>';
}

function render() {
  var f = filterState();
  var rows = G.decls.filter(function (d) { return matchesFilter(d, f.q, f.k, f.m); });
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
  /* Redrawn only when the panel is OPEN; a closed one costs nothing, and the
     toggle handler below draws it on first open. */
  function redrawIfOpen() {
    if ($("overview").open) diagram();
  }
  /* Search is debounced and the two selects are not: a select fires once per
     choice, while typing fires per keystroke and the layout is the expensive
     part -- the same trade the resize handler below makes, at the same 150ms.
     The LIST stays undebounced either way, so typing still feels immediate;
     only the picture waits. */
  var flt;
  $("q").addEventListener("input", function () {
    render();
    clearTimeout(flt);
    flt = setTimeout(redrawIfOpen, 150);
  });
  /* The diagram narrows with EVERY filter, not just the module one. A
     754-declaration instance is over DIA_MAX and refuses to draw, so before
     this the only way to get a picture was to know which module to pick;
     a search that narrows the set under the limit now earns one too. */
  $("kind").addEventListener("change", function () { render(); redrawIfOpen(); });
  $("mod").addEventListener("change", function () { render(); redrawIfOpen(); });
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
    if ($("overview").open && !$("ov-svg").childNodes.length) diagram();
  });
  /* The width budget is the panel's own width, so a resize changes how many
     boxes fit a row. Without this the layout keeps the width it was built at
     and the reader is back to a shrunk picture -- the defect the budget
     exists to remove. Debounced, because a drag fires this continuously and
     the layout is the expensive part. */
  var rsz;
  window.addEventListener("resize", function () {
    if (!$("overview").open || !$("ov-svg").childNodes.length) return;
    clearTimeout(rsz);
    rsz = setTimeout(diagram, 150);
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

  // ── Rule 1: a HANDLER rendering a kind's assets ────────────────────────
  //
  // `<base>/<handler>/<kind>/<optional subject>` — the owner's own example is
  // `<base>/cat-harness/docs/who-iris/`. The handler is THIS instance, the
  // kind names what it renders, the subject scopes it to one instance.
  //
  // Rule 2, `<base>/<instance>/`, is the instance presenting ITSELF, and a
  // subject page must never be published there: it would squat on that
  // instance's own site.
  //
  // Read BEFORE the projection because the projection now carries the subject
  // pages' tile counts, and their keys are derived from the page paths this
  // composes. It was read after the projection until #863.
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }

  // One page per SUBJECT — read from the modules actually found, so a
  // declared-but-empty directory gets no page claiming to show it.
  const subjects = [...new Set(g.modules.map((m) => m.instance))].sort();

  /**
   * Each subject page's tile count, keyed by the DECLARED directory id.
   *
   * Nothing is composed from the subject name. `folio-assistant-core`'s
   * directory is declared `folio-assist-core-schemas` while its three
   * siblings follow `${subject}-schemas`, so a composed key would badge three
   * tiles and leave the fourth silently uncounted — see
   * `directoryByVisualisationRef`, which carries the table.
   *
   * A subject whose page no declaration names contributes NOTHING rather than
   * a zero: it is a page with no tile, so there is nothing to badge, and an
   * invented entry would be a count for a directory nobody declared.
   */
  // THIS INSTANCE'S declaration only, because that is the one that produces
  // tiles: `sync-docs-harness.ts` calls `graphTiles(readDeclaration(ROOT)
  // .directories)`. Scanning every instance was the first draft and it was
  // wrong in a way worth recording, because it looked more thorough:
  //
  // a page is NOT uniquely owned by one directory id. The page at
  // `.../library/agent-skills/` is `agent-skills-library` to this instance and
  // plain `library` to the agent-skills instance, which declares its own view
  // of it. Scanning both meant the first-wins rule picked an id that is not a
  // tile here, so `agent-skills-library` silently lost its badge while
  // `uploads` gained a count over the wrong page entirely.
  //
  // The rule that falls out: look the ref up in the SAME list the tiles came
  // from, or the ids do not correspond to tiles at all.
  const byRef = directoryByVisualisationRef(readDeclaration(ROOT)?.directories ?? []);
  const scoped: Record<string, readonly [number, string]> = {};
  /** The repo-relative ref of a page this run emits, as a declaration spells it. */
  const refOf = (dirPath: string): string =>
    relative(REPO_ROOT, join(viewerPlacement(site, dirPath, seg).pageDir, "index.html"))
      .split(sep)
      .join("/");

  // The UNSCOPED page first: it shows every module, so its count is the whole
  // graph — and it gets one only if some directory declares it. Nothing does
  // today, which is why this contributes nothing rather than a stray entry.
  // Pluralised by the DECLARER, per `tile-count.ts`: only it knows whether its
  // unit pluralises regularly. `module` does, but the rule is the unit's
  // owner's to apply, and a tile reading "1 modules" undermines the number.
  const modules = (n: number): readonly [number, string] =>
    [n, n === 1 ? "module" : "modules"];
  const wholeId = byRef.get(refOf(`${handler}/${seg}`));
  if (wholeId !== undefined) scoped[wholeId] = modules(g.modules.length);

  // Then each SUBJECT page, counted over that subject alone.
  for (const subject of subjects) {
    const id = byRef.get(refOf(`${handler}/${seg}/${subject}`));
    if (id === undefined) continue;
    scoped[id] = modules(g.modules.filter((m) => m.instance === subject).length);
  }

  const data = JSON.stringify(projection(g, scoped), null, 2) + "\n";
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
  const { pageDir, dataDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, seg);
  emit(join(dataDir, "index.json"), data);
  emit(join(pageDir, "index.html"), viewerHtml(dataHref));

  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, seg);
    emit(join(sub.pageDir, "index.html"), viewerHtml(sub.dataHref, subject));
  }


  // ── ORPHANS (bean `ankg`) ──────────────────────────────────────────────
  //
  // A subject page the declaration no longer describes. `emit()` cannot see
  // one — it compares only the files it is about to write — so this is asked
  // separately, and in `--check` an orphan is a FINDING rather than silence.
  const { owned, foreign } = orphanSubjectPages(pageDir, subjects);
  for (const name of foreign) {
    // Reported and LEFT. Ownership could not be established from the file, and
    // `deletion-requires-confirmation` is about exactly this case.
    console.error(`  ! ${join(pageDir, name)} is not a subject and does not identify itself — left in place`);
  }
  for (const name of owned) {
    const dir = join(pageDir, name);
    if (check) {
      console.error(`  ✗ ${dir} is an orphan — it serves a subject the declaration no longer describes`);
      stale++;
      continue;
    }
    rmSync(dir, { recursive: true });
    console.log(`  ✗ pruned ${dir}`);
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
