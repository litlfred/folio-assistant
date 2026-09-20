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
import { basename, dirname, join, sep } from "node:path";

import { readSchemaGraph, schemaRoots, type SchemaGraph } from "./schema-graph.ts";
import { siteDirFor } from "../schemas/cat-harness.ts";
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
      line: d.line,
      exported: d.exported,
    })),
    edges: g.edges,
  };
}

/**
 * The viewer page.
 *
 * One file, no data. It reads `../assets/schemas/index.json` relative to its
 * own URL — the page sits at `<site>/schemas/` and the projection at
 * `<site>/assets/schemas/`, so the relative path is a property of the layout
 * rather than of the host.
 */
export function viewerHtml(): string {
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
</style>
</head>
<body>
<header>
  <h1>Schema graph</h1>
  <p class="counts" id="counts">loading…</p>
</header>
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
  var h = '<h2>' + esc(d.name) + '</h2><p class="sub">' + esc(d.module) + ":" + d.line +
    ' &middot; ' + esc(d.kind) + (d.exported ? "" : " &middot; not exported") + "</p>";
  if (d.doc) h += "<p>" + esc(d.doc) + "</p>";
  if (d.kind === "undetermined") {
    h += '<p class="note"><strong>Could not be classified.</strong> This is not "it has no fields" — ' +
      "the reader saw an expression it does not model, and says so rather than rendering an empty type: <code>" +
      esc(d.note || "") + "</code></p>";
  }
  h += uml(d);
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

function render() {
  var q = $("q").value.trim().toLowerCase();
  var k = $("kind").value, m = $("mod").value;
  var rows = G.decls.filter(function (d) {
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
  $("counts").innerHTML = "<b>" + rows.length + "</b> of <b>" + G.decls.length + "</b> declarations &middot; <b>" +
    G.modules.length + "</b> modules &middot; <b>" + G.edges.length + "</b> edges &middot; <b>" +
    G.decls.filter(function (d) { return d.kind === "undetermined"; }).length + "</b> undetermined";
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

fetch("../assets/schemas/index.json").then(function (r) {
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}).then(function (data) {
  G = data;
  G.declIndex = {};
  G.decls.forEach(function (d) { G.declIndex[d.id] = d; });
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
  $("detail").addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a) { e.preventDefault(); select(decodeURIComponent(a.getAttribute("href").slice(1))); }
  });
  render();
  if (location.hash.length > 1) select(decodeURIComponent(location.hash.slice(1)));
}).catch(function (e) {
  $("counts").textContent = "could not load the projection: " + e.message;
  $("detail").innerHTML = '<p class="empty">The projection at <code>../assets/schemas/index.json</code> could not be read. ' +
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
  emit(join(site, "assets", seg, "index.json"), data);
  emit(join(site, seg, "index.html"), viewerHtml());
  if (!check) {
    console.log(
      `  ${g.modules.length} module(s), ${g.decls.length} declaration(s), ${g.edges.length} edge(s), ` +
        `${g.decls.filter((d) => d.kind === "undetermined").length} undetermined; ` +
        `projection ${(Buffer.byteLength(data) / 1024).toFixed(0)} KB`,
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run schema:viz\``);
    process.exit(1);
  }
}
