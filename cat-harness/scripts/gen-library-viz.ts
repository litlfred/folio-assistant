#!/usr/bin/env bun
/**
 * Publish the L1 corpus as a projection, and a viewer over it.
 *
 * @module scripts/gen-library-viz
 * @graphNode none — a generator over the library graph, not a schema itself
 *
 * Sibling of `gen-schema-viz.ts` and deliberately the same three pieces: a
 * reader (`library-graph.ts`), a projection under `<site>/assets/<graph>/`,
 * and a zero-dependency viewer under `<site>/<graph>/` that fetches the
 * projection relative to its own location. The published segment is the
 * DECLARED directory's own name, read rather than written down, so a rename
 * moves the source and the URL together.
 *
 * ## Two views, because the owner asked for two
 *
 * > need (srotable) lisiting (w/ metadata) and folio/desktop view
 *
 * - **Listing** — every column sortable, every metadatum visible. This is the
 *   view that answers "which is the biggest", "which has no OCR", "which
 *   came from which upload".
 * - **Desktop** — the corpus as tiles, the folio/Miro-board metaphor `yj32`
 *   describes. This is the view that answers "what is in here" before you
 *   know what you are looking for.
 *
 * They are two renderings of ONE projection, not two pages. A reader who
 * sorts in the listing and switches to the desktop is looking at the same set.
 *
 * ## Read-only on assets, on purpose
 *
 * The owner, 2026-09-20: *"just on that subgraph w/o edit functionality"*.
 * Nothing here edits a section, a structure or an OCR page — and that is what
 * lets this ship before the write-path question on `yj32` is answered.
 * `jbx2`'s materialise-into-a-folio action and `v1hw`'s upload affordance are
 * writes and are not in this file.
 *
 * ## The three-state ingestion display, which is the point of the bean
 *
 * `jbx2` requires ingestion state as THREE states rather than a tick or a
 * cross, and OCR is the case that forces it: **0 OCR pages because the source
 * was never scanned is not a failure**, and an `ocr/` directory that exists
 * and is empty is a third answer again. The viewer renders `scanned`,
 * `not scanned` and `empty` as three different things, and none of them is
 * styled as an error.
 *
 * Usage:
 *   bun run library:viz          # write
 *   bun run library:viz:check    # fail if either artefact is stale
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fragment as folioMountFragment } from "./folio-mount.ts";
import { basename, dirname, join, relative, sep } from "node:path";

import { readLibraryGraph, type LibraryGraph,
  readEntryBlocks,
} from "./library-graph.ts";
import { scanLibraryRefs, type RefSource } from "./library-refs.ts";
import { orphanSubjectPages, viewerPlacement } from "./gen-schema-viz.ts";
import { readDeclaration } from "../schemas/cat-harness.ts";
import { directoriesForGraph, instanceRootsIn, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { directoryByVisualisationRef } from "./graph-tiles.ts";
import { tileCounts } from "../schemas/tile-count.js";
import { itemState } from "./gen-uploads-viz.ts";

const ROOT = join(import.meta.dir, "..");
const REPO_ROOT = repoRootFor(ROOT);
const check = process.argv.includes("--check");

/** The projection. Everything the reader found; it is already small. */
function projection(
  g: LibraryGraph,
  /** Per-page counts, `directory id -> [count, unit]`. Empty is normal. */
  scoped: Readonly<Record<string, readonly [number, string]>>,
): unknown {
  return {
    $schema: "folio-library-index/v1",
    // TWO tiles, ONE dataset — the case `schemas/tile-count.ts` is keyed by
    // directory for. `flh4` put the queue block here rather than under a
    // second projection, "since two projections over it would be two answers
    // to how many are queued", and `gen-uploads-viz.ts` publishes a viewer
    // with no projection of its own. So this file owes both numbers.
    //
    // They are DIFFERENT questions, not one number shown twice:
    //   `library` — how much corpus there is, which is `entries`
    //   `uploads` — how much is WAITING, which is not an array length at all.
    //     A total would read as reassurance; the queue exists because the
    //     corpus grep searches `library/` only, so a file still waiting here
    //     makes a clean grep read as "nobody has done this" (#836).
    //
    // `itemState` rather than a second `ingestedBy` test: one definition of
    // waiting, and it is the viewer's own.
    //
    // `uploads` is keyed directly because its page is UNSCOPED — the queue
    // view shows every waiting unit — so a total is the count of the page that
    // tile opens. Everything else comes through `scoped`, computed per page.
    //
    // THE LIBRARY ENTRY USED TO BE KEYED HERE TOO, AS `g.entries.length`, AND
    // IT WAS WRONG. The `library` directory declares its visualiser as
    // `.../library/cat-harness/index.html` — the cat-harness-SCOPED page — and
    // cat-harness holds no entries at all (its own declaration says "THIS
    // INSTANCE HOLDS NONE"; bean `frs5` moved all four out). So the badge read
    // 8 over a page showing 0: not merely imprecise, but the single most
    // misleading number that tile could carry, and precisely the
    // empty-viewer case bean `v18c` observed and this whole feature exists to
    // surface. Shipped that way in #862 and corrected in #863.
    ...tileCounts({
      uploads: [g.uploads.filter((u) => itemState(u) === "waiting").length, "waiting"],
      ...scoped,
    }),
    ...g,
  };
}

/**
 * `mount` is the folio mount fragment, passed IN rather than composed here.
 *
 * It carries the pattern that finds the site root from one of these pages'
 * URLs, and that pattern is a fact about where the CALLER publishes — the
 * handler and segment it chose. Building it inside this shared viewer would
 * bake one publication layout into a function two generators call, which is
 * the same boundary `gen-iris-pages` keeps by declaring its own route.
 *
 * Empty by default, so a caller that publishes no folio surface emits no
 * mount and nothing changes for it. Absent is a real state.
 */
export function viewerHtml(dataHref: string, scope = "", mount = ""): string {
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
<title>Library — the L1 corpus</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%23276749'/%3E%3Crect x='3.5' y='3' width='3' height='10' fill='white'/%3E%3Crect x='7.5' y='3' width='2' height='10' fill='white'/%3E%3Crect x='10.5' y='4' width='2' height='9' fill='white'/%3E%3C/svg%3E">
<style>
:root {
  --bg:#fff; --fg:#17191c; --muted:#5b6168; --line:#d9dde2; --panel:#f6f7f9;
  --accent:#276749; --accent-soft:#e6f2ec; --warn:#8a5300; --warn-soft:#fdf3e0;
  --info:#1a5fb4; --info-soft:#e7eefb; --box:#fff;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24;
    --accent:#7fc7a1; --accent-soft:#16291f; --warn:#e0b25e; --warn-soft:#2a2213;
    --info:#7aa7e8; --info-soft:#1d2937; --box:#1b1f24;
  }
}
:root[data-theme="dark"] {
  --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24;
  --accent:#7fc7a1; --accent-soft:#16291f; --warn:#e0b25e; --warn-soft:#2a2213;
  --info:#7aa7e8; --info-soft:#1d2937; --box:#1b1f24;
}
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
header { padding:16px; border-bottom:1px solid var(--line); }
h1 { font-size:1.15rem; margin:0 0 6px; }
.badges { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 0; }
.badge { border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-size:.82rem; background:var(--panel); }
.badge b { font-variant-numeric:tabular-nums; }
.badge.q b { color:var(--warn); }
.toolbar { padding:10px 16px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; border-bottom:1px solid var(--line); }
input, select, button { font:inherit; color:var(--fg); background:var(--box);
  border:1px solid var(--line); border-radius:6px; padding:6px 9px; }
input { flex:1 1 200px; min-width:0; }
.seg { display:inline-flex; border:1px solid var(--line); border-radius:6px; overflow:hidden; }
.seg button { border:0; border-radius:0; background:transparent; cursor:pointer; padding:6px 12px; }
.seg button[aria-pressed="true"] { background:var(--accent-soft); color:var(--fg); font-weight:600; }
main { padding:0 0 40px; }
table { border-collapse:collapse; width:100%; font-size:.86rem; }
th, td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
th { position:sticky; top:0; background:var(--bg); color:var(--muted); font-size:.74rem;
  text-transform:uppercase; letter-spacing:.04em; }
th button { border:0; background:transparent; padding:0; font:inherit; color:inherit;
  cursor:pointer; text-transform:inherit; letter-spacing:inherit; }
th button:hover { color:var(--fg); text-decoration:underline; }
th[aria-sort] button::after { content:" ▲"; }
th[aria-sort="descending"] button::after { content:" ▼"; }
td.num { text-align:right; font-variant-numeric:tabular-nums; }
tbody tr:hover { background:var(--panel); }
.slug { font-family:ui-monospace, Menlo, monospace; }
.pill { display:inline-block; font-size:.7rem; padding:1px 7px; border-radius:999px;
  border:1px solid var(--line); color:var(--muted); }
.pill.ok { color:var(--accent); background:var(--accent-soft); border-color:var(--accent); }
.pill.warn { color:var(--warn); background:var(--warn-soft); border-color:var(--warn); }
.pill.info { color:var(--info); background:var(--info-soft); border-color:var(--info); }
#desktop { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));
  gap:14px; padding:16px; }
.card { border:1px solid var(--line); border-radius:10px; background:var(--panel);
  padding:12px; display:flex; flex-direction:column; gap:6px; }
.card h3 { margin:0; font-size:.92rem; line-height:1.3; }
.card .slug { font-size:.74rem; color:var(--muted); }
.card .rows { font-size:.78rem; color:var(--muted); display:grid;
  grid-template-columns:auto 1fr; gap:1px 8px; margin-top:2px; }
.card .rows b { color:var(--fg); font-weight:600; font-variant-numeric:tabular-nums; }
.card .tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.spine { height:6px; border-radius:3px; background:var(--accent); opacity:.65; }
.empty { color:var(--muted); padding:24px 16px; }
h2 { font-size:.95rem; margin:24px 16px 4px; }
p.note { color:var(--muted); font-size:.82rem; margin:0 16px 8px; }
.wrap { overflow:auto; }
/* THE BOOK'S AVATAR, first in its row -- bean zrvt, issue #1006. A fixed box
   so a row does not reflow when the cover arrives, and a glyph of the same
   size when there is no picture, so "no cover" never looks like a broken one. */
.lib-ava { display:inline-flex; align-items:center; justify-content:center;
  width:34px; height:46px; margin-right:8px; vertical-align:middle; flex:0 0 auto;
  border:1px solid var(--line); background:var(--panel); overflow:hidden; }
.lib-ava img { width:100%; height:100%; object-fit:cover; display:block; }
.lib-ava svg { width:22px; height:22px; fill:none; stroke:var(--muted); stroke-width:1.6; }
td.lib-first { white-space:nowrap; }
.card .lib-ava { width:56px; height:76px; }
</style>
</head>
<body>
<header>
  <h1>Library — the L1 corpus</h1>
  <p class="empty" id="status" style="padding:0">loading…</p>
  <div class="badges" id="badges"></div>
</header>
<div class="toolbar">
  <input id="q" type="search" placeholder="Search entries…" aria-label="Search entries">
  <span class="seg" role="group" aria-label="View">
    <button type="button" id="vList" aria-pressed="true">Listing</button>
    <button type="button" id="vDesk" aria-pressed="false">Desktop</button>
  </span>
</div>
<main>
  <section id="listing" class="wrap"></section>
  <section id="desktop" hidden></section>
  <section id="blocks" class="wrap" hidden aria-live="polite"></section>
  <h2>Uploads — the queue feeding this</h2>
  <p class="note">A source sitting here reads as <strong>absent</strong> to every consumer while the file is on disk.
    Queues are counted per declaring instance and never merged.</p>
  <section id="queue" class="wrap"></section>
</main>
<script>
"use strict";
var G = null, SORT = { key: "id", dir: 1 }, VIEW = "list";
var DATA_HREF = "${dataHref}";
/* The SUBJECT this page is scoped to, or "" for the handler's whole view.
   One projection serves both — a second JSON per subject would be the same
   facts written N+1 times, free to disagree the moment one is regenerated. */
var SCOPE = "${scope}";
function inScope(x){ return !SCOPE || x.instance === SCOPE; }
/* THE SITE ROOT, derived from the projection's own relative address rather
   than declared -- the page is served at more than one depth, and DATA_HREF
   is already the one path that is right at every one of them. */
var SITE_ROOT = new URL(DATA_HREF.slice(0, DATA_HREF.length - "assets/library/index.json".length), location.href).pathname;
/* An entry's avatar URL, or "". The projection carries a SITE-ROOT path
   (library-graph.ts avatarOf), absent when there is no picture or the site
   does not serve it; nothing is guessed here either. */
function avatarUrl(e){
  var h = e.avatar && typeof e.avatar.href === "string" ? e.avatar.href : "";
  return h.charAt(0) === "/" ? SITE_ROOT + h.slice(1) : "";
}
var BOOK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>';
/* A cover that fails to load falls back to the glyph. ONE capturing listener
   rather than an inline onerror per image: 'error' does not bubble, and an
   inline handler is a script-src relaxation this site does not make. */
document.addEventListener("error", function(ev){
  var t = ev.target;
  if (t && t.tagName === "IMG" && t.parentNode && t.parentNode.classList &&
      t.parentNode.classList.contains("lib-ava")) t.parentNode.innerHTML = BOOK_SVG;
}, true);
function avatarHtml(e){
  var u = avatarUrl(e);
  return '<span class="lib-ava">' + (u
    ? '<img src="' + esc(u) + '" alt="" loading="lazy">'
    : BOOK_SVG) + "</span>";
}
function $(i){ return document.getElementById(i); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function kb(n){ return n >= 1048576 ? (n/1048576).toFixed(1)+" MB" : Math.round(n/1024)+" KB"; }

/* The three-state OCR display jbx2 asks for. "Never scanned" is a DETERMINED
   answer, not a failure, and an ocr/ directory that exists and is empty is a
   third answer again — so none of the three is styled as an error. */
function ocrState(e){
  if (!e.hasOcr) return { label: "not scanned", cls: "" };
  if (e.ocrPages > 0) return { label: e.ocrPages + " OCR pages", cls: "info" };
  return { label: "ocr/ present, empty", cls: "warn" };
}
/* Three states again, and the middle one is the point of the whole column.
   The library is L1 because every reference to a source resolves through it,
   so a slug nothing names is a slug that claim is NOT true of -- a finding
   rather than a blank. A scan that did not run is a third answer: the
   projection carries no refScan, so nobody looked.
   (No backticks in here. See the warning at the top of viewerHtml.) */
function refState(e){
  if (!e.referencedBy) return { label: "not scanned", cls: "", n: -1 };
  var n = e.referencedBy.length;
  if (n === 0) return { label: "referenced by nothing", cls: "warn", n: 0 };
  var kinds = {};
  e.referencedBy.forEach(function(r){ kinds[r.kind] = (kinds[r.kind]||0) + 1; });
  var parts = Object.keys(kinds).sort().map(function(k){ return kinds[k] + " " + k; });
  return { label: parts.join(", "), cls: "ok", n: n };
}
function uploadState(e){
  return {
    match:   { label: "source verified", cls: "ok" },
    differs: { label: "source DIFFERS", cls: "warn" },
    absent:  { label: "source not in a queue", cls: "warn" },
    unknown: { label: "no source named", cls: "" }
  }[e.upload] || { label: e.upload, cls: "" };
}

var COLS = [
  { k:"id",       t:"slug",     n:false, f:function(e){ return avatarHtml(e) + '<span class="slug">'+esc(e.id)+"</span>"; } },
  { k:"title",    t:"title",    n:false, f:function(e){ return esc(e.title); } },
  { k:"instance", t:"instance", n:false, f:function(e){ return '<span class="pill">'+esc(e.instance)+"</span>"; } },
  { k:"rung",     t:"rung",     n:false, f:function(e){ return '<span class="pill '+(e.rung==="none"?"warn":"ok")+'">'+esc(e.rung)+"</span>"; } },
  { k:"sections", t:"sections", n:true },
  { k:"blocks",   t:"blocks",   n:true },
  { k:"images",   t:"images",   n:true },
  { k:"ocrPages", t:"ocr",      n:true, f:function(e){ var s=ocrState(e); return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"; } },
  { k:"pageEnd",  t:"pages",    n:true, f:function(e){ return e.pageStart==null?'<span class="pill">—</span>':esc(e.pageStart+"–"+e.pageEnd); } },
  { k:"words",    t:"words",    n:true, f:function(e){ return e.words.toLocaleString(); } },
  { k:"bytes",    t:"size",     n:true, f:function(e){ return kb(e.bytes); } },
  { k:"refCount", t:"referenced by", n:true, f:function(e){ var s=refState(e);
      // The join separator is written with a DOUBLED backslash on purpose:
      // this page is a template literal, so a single one is eaten by
      // TypeScript and emitted as a real line break inside the browser's
      // string — which does not parse, and took the whole viewer down.
      var files = (e.referencedBy||[]).map(function(r){ return r.from + " (" + r.count + ")"; }).join("\\n");
      return '<span class="pill '+s.cls+'"'+(files?' title="'+esc(files)+'"':"")+">"+esc(s.label)+"</span>"; } },
  { k:"upload",   t:"source",   n:false, f:function(e){ var s=uploadState(e);
      return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"+(e.sourceFile?'<br><span class="slug" style="font-size:.72rem;color:var(--muted)">'+esc(e.sourceFile)+"</span>":""); } }
];

function rows(){
  var q = $("q").value.trim().toLowerCase();
  var r = G.entries.filter(function(e){
    if (!inScope(e)) return false;
    if (!q) return true;
    return (e.id+" "+e.title+" "+e.sourceFile+" "+e.docId+" "+e.instance).toLowerCase().indexOf(q) >= 0;
  });
  var k = SORT.key, d = SORT.dir;
  return r.sort(function(a,b){
    var x=a[k], y=b[k];
    if (typeof x === "number" && typeof y === "number") return (x-y)*d;
    return String(x==null?"":x).localeCompare(String(y==null?"":y))*d;
  });
}

function renderList(){
  var r = rows();
  var h = "<table><thead><tr>" + COLS.map(function(c){
    var sorted = SORT.key === c.k;
    return "<th" + (sorted ? ' aria-sort="'+(SORT.dir>0?"ascending":"descending")+'"' : "") +
      '><button type="button" data-k="'+c.k+'">'+esc(c.t)+"</button></th>";
  }).join("") + "</tr></thead><tbody>";
  h += r.map(function(e){
    /* THE ROW DECLARES ITSELF, and the folio reads nothing else.
       A selector guessing at cell positions would bind to this generator's
       markup and break silently the next time a column moves; an attribute
       is a contract. docs-ui.js decorates any row carrying these and
       ignores every page that has none -- so this generator knows nothing
       about the folio beyond emitting three attributes. R30, bean j2if. */
    var key = e.instance + "/" + e.id;
    /* THE HREF IS THIS PAGE, ANCHORED -- and it is composed from
       location.pathname rather than declared anywhere.

       Measured 2026-09-22 before choosing: an ingested library document has
       NO published page of its own. Nothing writes one; this viewer is the
       only thing that renders these entries at all. So there was no stale
       URL to fix, there was no URL. The owner named the reason a per-asset
       route was the wrong shape -- "asset has too much drift" -- and ruled
       the route belongs to the HARNESS.

       cat-harness owns this viewer, so the viewer IS the asset's address.
       Composing it from the page's own location means the same generator
       emits both the row and the page it points at, and a reader arriving
       at the anchor gets the row selected rather than a 404. Nothing to
       declare, so nothing to drift -- the folio-mount's argument for
       deriving its root, applied one level in. */
    var href = location.pathname + "#" + encodeURIComponent(key);
    /* data-fa-pullout-host puts the pull-out control in the FIRST cell.
       It used to land in the last one, which on a table wider than the
       screen is past its right edge -- the owner could not find a way onto
       the glass at all (issue #1006). */
    return '<tr data-fa-library-item="' + esc(key) + '"' +
      ' data-fa-library-href="' + esc(href) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '">' + COLS.map(function(c, i){
      return "<td"+(c.n?' class="num"':i===0?' class="lib-first" data-fa-pullout-host':"")+">" + (c.f ? c.f(e) : esc(e[c.k])) + "</td>";
    }).join("") + "</tr>";
  }).join("") || '<tr><td colspan="'+COLS.length+'"><p class="empty">Nothing matches.</p></td></tr>';
  $("listing").innerHTML = h + "</tbody></table>";
}

function renderDesk(){
  var r = rows();
  $("desktop").innerHTML = r.map(function(e){
    var o = ocrState(e), u = uploadState(e);
    /* The SAME three attributes the listing row carries, so a card is a
       library item too and the folio's pull-out finds it in either view. */
    var key = e.instance + "/" + e.id;
    return '<article class="card" data-fa-library-item="' + esc(key) + '"' +
      ' data-fa-library-href="' + esc(location.pathname + "#" + encodeURIComponent(key)) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '"><div class="spine"></div>' +
      '<div data-fa-pullout-host style="display:flex;gap:8px;align-items:flex-start">' + avatarHtml(e) +
      "<h3>"+esc(e.title)+"</h3></div>" +
      '<div class="slug">'+esc(e.instance)+" / "+esc(e.id)+"</div>" +
      '<div class="rows">' +
        "<span>sections</span><b>"+e.sections+"</b>" +
        "<span>blocks</span><b>"+e.blocks+"</b>" +
        "<span>images</span><b>"+e.images+"</b>" +
        "<span>pages</span><b>"+(e.pageStart==null?"—":e.pageStart+"–"+e.pageEnd)+"</b>" +
        "<span>words</span><b>"+e.words.toLocaleString()+"</b>" +
        "<span>size</span><b>"+kb(e.bytes)+"</b>" +
      "</div>" +
      '<div class="tags"><span class="pill '+(e.rung==="none"?"warn":"ok")+'">'+esc(e.rung)+"</span>" +
        '<span class="pill '+o.cls+'">'+esc(o.label)+"</span>" +
        '<span class="pill '+u.cls+'">'+esc(u.label)+"</span>" +
        '<span class="pill '+refState(e).cls+'">'+esc(refState(e).label)+"</span></div>" +
      "</article>";
  }).join("") || '<p class="empty">Nothing matches.</p>';
}

function renderQueue(){
  var h = "<table><thead><tr><th>unit</th><th>queue</th><th>kind</th><th>size</th><th>state</th></tr></thead><tbody>";
  h += G.uploads.filter(inScope).map(function(u){
    /* An intake is ONE queued document however many files it declares, and
       the row says so — otherwise a four-file capture reads as four things
       waiting. The count comes from the intake's own declared file list. */
    var kind = u.kind === "intake"
      ? '<span class="pill info">intake · ' + u.declaredFiles + " file" + (u.declaredFiles === 1 ? "" : "s") + "</span>"
      : esc(u.ext || "—");
    var label = esc(u.file) + (u.kind === "intake" && u.title
      ? '<br><span style="font-family:inherit;color:var(--muted);font-size:.78rem">' + esc(u.title) + "</span>" : "");
    return '<tr><td class="slug">' + label + '</td><td><span class="pill">' + esc(u.instance) +
      "</span></td><td>" + kind + '</td><td class="num">' + kb(u.bytes) + "</td><td>" +
      (u.ingestedBy ? '<span class="pill ok">ingested → ' + esc(u.ingestedBy) + "</span>"
                    : '<span class="pill warn">uningested</span>') + "</td></tr>";
  }).join("") || '<tr><td colspan="5"><p class="empty">No uploads queue for this subject.</p></td></tr>';
  $("queue").innerHTML = h + "</tbody></table>";
}

function render(){ if (VIEW === "list") renderList(); else renderDesk(); }

/* A LINK TO #<id> SELECTS THAT ROW, or says it is not on this page.

   The folio composes an asset's address as this page plus a fragment, so
   this is the other half of that contract. Without it the link resolves to
   the page and lands the reader at the top of an unfiltered table -- which
   is pb04: an affordance that goes somewhere, just not where it said.

   THREE OUTCOMES, not two. The row is here and is selected; the id names an
   entry this page does not scope, and the page says so rather than showing
   an empty table with no explanation; or there is no fragment at all and
   nothing happens. The middle one is the case a reader actually hits --
   a folio carries assets across libraries, so an anchor for another
   instance's asset is ordinary rather than exceptional. */
function honourAnchor(){
  var raw = location.hash.replace(/^#/, "");
  if (!raw) return;
  var key;
  try { key = decodeURIComponent(raw); } catch (_e) { key = raw; }

  var known = G.entries.filter(function(e){ return e.instance + "/" + e.id === key; })[0];
  if (!known) return;                       /* not ours to explain */

  if (!inScope(known)) {
    $("status").textContent =
      key + " is in your folio but is not shown on this page \u2014 it belongs to " +
      known.instance + ". Open that library to see it.";
    return;
  }

  /* Filter to it rather than scrolling: the table is sortable and paged by
     nothing, so a scroll target moves the next time somebody sorts, while a
     filter puts the row under the reader's eye whatever the order. */
  if (VIEW !== "list") setView("list");
  $("q").value = known.id;
  renderList();
  var row = document.querySelector('[data-fa-library-item="' + key.replace(/"/g, '\\"') + '"]');
  if (row) {
    row.setAttribute("data-fa-anchored", "1");
    row.scrollIntoView({ block: "center" });
  }
  /* The graph of the thing the reader just opened — bean 7nvr. Driven off the
     anchor rather than a click so a shared URL lands on the same view. */
  loadBlocks(known.id);
}

/* THE BLOCK GRAPH OF ONE ENTRY, fetched only when a reader opens one.
   Bean 7nvr.

   The index carries a COUNT of blocks; this is what they are. It is a
   separate fetch because the corpus holds 1715 blocks over about a megabyte
   of JSON-LD against a 44 KB index, so inlining would multiply the cost of
   the page that answers "what is in here" to serve a question asked about
   one entry at a time.

   THREE OUTCOMES, like honourAnchor above. The file loads and the blocks are
   listed; the file loads and the entry genuinely has none, which is a
   determined answer and says so; or the fetch fails, which is reported as a
   failure rather than rendered as an empty document. An entry with no blocks
   and an entry we could not read must never look the same. */
function blocksHref(id){
  var dir = DATA_HREF.slice(0, DATA_HREF.lastIndexOf("/") + 1);
  return dir + "entries/" + encodeURIComponent(id) + ".json";
}
function renderBlocks(id, data, err){
  var el = $("blocks");
  el.hidden = false;
  if (err) {
    el.innerHTML = '<h2>Blocks</h2><p class="empty">Could not read the block graph for ' +
      esc(id) + ' \u2014 ' + esc(err) + '. This is a failure to read, not an empty document.</p>';
    return;
  }
  var bs = (data && data.blocks) || [];
  if (!bs.length) {
    el.innerHTML = '<h2>Blocks</h2><p class="empty">' + esc(id) +
      ' has no blocks. Nothing failed \u2014 the entry carries none.</p>';
    return;
  }
  el.innerHTML = '<h2>Blocks \u2014 ' + esc(id) + ' <span class="note">(' + bs.length +
    ', in page order)</span></h2><table><thead><tr>' +
    '<th>page</th><th>kind</th><th>types</th><th>title</th><th>narrative</th></tr></thead><tbody>' +
    bs.map(function(b){
      /* BOTH types, never one. A block is dual-typed so a DoCO reader gets
         something without knowing our vocabulary, and showing only ours
         would hide the half this project did not invent. */
      var pages = b.pageStart == null ? '\u2014'
        : (b.pageEnd != null && b.pageEnd !== b.pageStart ? b.pageStart + '\u2013' + b.pageEnd : String(b.pageStart));
      /* A narrative state is three-valued and none of them is an error:
         not-authored means nobody has written one, which is a fact rather
         than a gap. Rendered as plain text for that reason. */
      var nar = b.narrative == null ? '\u2014' : esc(b.narrative);
      return '<tr><td class="num">' + esc(pages) + '</td><td>' + esc(b.kind) +
        '</td><td>' + esc((b.types || []).join(' + ')) + '</td><td>' + esc(b.title || '\u2014') +
        '</td><td>' + nar + '</td></tr>';
    }).join("") + '</tbody></table>';
}
function loadBlocks(id){
  fetch(blocksHref(id), {cache: "no-store"})
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){ renderBlocks(id, d, null); })
    .catch(function(e){ renderBlocks(id, null, String(e && e.message || e)); });
}

function setView(v){
  VIEW = v;
  $("vList").setAttribute("aria-pressed", String(v === "list"));
  $("vDesk").setAttribute("aria-pressed", String(v === "desk"));
  $("listing").hidden = v !== "list";
  $("desktop").hidden = v !== "desk";
  render();
}

fetch(DATA_HREF).then(function(r){
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}).then(function(data){
  G = data;
  /* A sortable number for the referenced-by column. -1 for "not scanned" so
     it sorts apart from a real zero rather than beside it. */
  G.entries.forEach(function(e){ e.refCount = e.referencedBy ? e.referencedBy.length : -1; });
  var scoped = G.entries.filter(inScope);
  var words = scoped.reduce(function(n,e){ return n + e.words; }, 0);
  $("status").textContent = (SCOPE ? SCOPE + " · " : "") + scoped.length + " entries · " +
    words.toLocaleString() + " words · " +
    scoped.reduce(function(n,e){ return n + e.sections; }, 0) + " sections";
  if (SCOPE) document.title = SCOPE + " — library";
  $("badges").innerHTML = G.queues.filter(inScope).map(function(q){
    return '<span class="badge q"><b>'+q.uningested+"</b> uningested in <code>"+esc(q.dir)+
      "</code> <span style=\\"color:var(--muted)\\">of "+q.total+"</span></span>";
  }).join("");
  if (G.refScan) {
    var none = scoped.filter(function(e){ return e.refCount === 0; }).length;
    $("badges").innerHTML += '<span class="badge"><b>'+G.refScan.filesRead+
      "</b> json file(s) scanned for references" +
      (none ? ', <b>'+none+"</b> entr(ies) referenced by nothing" : "") +
      (G.refScan.unreadable.length
        ? ' <span class="pill warn" title="'+esc(G.refScan.unreadable.join("\\n"))+'">'+
          G.refScan.unreadable.length+" unreadable — the zeros are provisional</span>"
        : "") + "</span>";
  }
  $("q").addEventListener("input", render);
  $("vList").addEventListener("click", function(){ setView("list"); });
  $("vDesk").addEventListener("click", function(){ setView("desk"); });
  $("listing").addEventListener("click", function(e){
    var b = e.target.closest("button[data-k]");
    if (!b) return;
    var k = b.getAttribute("data-k");
    SORT = { key: k, dir: SORT.key === k ? -SORT.dir : 1 };
    renderList();
  });
  render();
  renderQueue();
  honourAnchor();
  window.addEventListener("hashchange", honourAnchor);
}).catch(function(e){
  $("status").textContent = "could not load the projection: " + e.message;
  $("listing").innerHTML = '<p class="empty">The projection at <code>' + esc(DATA_HREF) + '</code> could not be read. ' +
    "That is not an empty corpus \\u2014 it is a corpus that could not be loaded, and the page says so rather than showing nothing.</p>";
});
</script>
${mount}
</body>
</html>
`;
}

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

/** `emit` for a binary file: same check-or-write contract, compared byte for byte. */
function emitBytes(path: string, content: Buffer): void {
  if (check) {
    if (existsSync(path) && readFileSync(path).equals(content)) return;
    console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
    stale++;
    return;
  }
  if (existsSync(path) && readFileSync(path).equals(content)) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ ${path}`);
}

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const g = readLibraryGraph([ROOT, repoRoot]);
  if (g === null) {
    console.log("  · no library or uploads directory is declared — nothing to publish");
    process.exit(0);
  }
  // ── Who references a slug — bean `jbx2`'s third ask ───────────────────
  //
  // The sources are DERIVED: every instance's own declaration, every
  // directory it names, labelled by that directory's declared graph kind. So
  // `catalogue` and `voices` appear because they are declared and carry the
  // field, not because this file lists them — and a new kind that starts
  // referencing slugs shows up the day it is declared.
  //
  // Each instance's SITE directory is skipped: it holds published copies of
  // the catalogue and of this projection, so scanning it would count the page
  // that displays a reference as a reference.
  {
    const repo = repoRootFor(ROOT);
    const sources: RefSource[] = [];
    for (const inst of instanceRootsIn(repo)) {
      const decl = readDeclaration(inst);
      if (!decl) continue;
      const siteDir = join(inst, siteDirFor(inst));
      for (const d of decl.directories ?? []) {
        const dir = join(inst, d.path);
        if (dir === siteDir || dir.startsWith(siteDir + "/")) continue;
        for (const kind of d.graphKinds ?? []) sources.push({ kind, instance: decl.name ?? basename(inst), dir });
      }
    }
    const scan = scanLibraryRefs(sources, repo);
    for (const e of g.entries) e.referencedBy = scan.bySlug[e.id] ?? [];
    g.refScan = { filesRead: scan.filesRead, unreadable: scan.unreadable };
    const orphans = g.entries.filter((e) => (e.referencedBy?.length ?? 0) === 0).map((e) => e.id);
    console.log(
      `  · references: ${scan.filesRead} json file(s) read, ` +
        `${Object.keys(scan.bySlug).length} slug(s) referenced, ` +
        `${orphans.length} entr(ies) referenced by nothing` +
        (orphans.length > 0 ? ` (${orphans.join(", ")})` : "") +
        (scan.unreadable.length > 0 ? ` — ${scan.unreadable.length} file(s) UNREADABLE, so the zeros are provisional` : ""),
    );
  }

  const site = join(ROOT, siteDirFor(ROOT));
  // The published segment is the DECLARED directory's own name — the same
  // rule `gen-schema-viz.ts` follows, and for the same reason: writing
  // "library" here would be a second answer to a question `harness.json`
  // already answers, and `check:declared-paths` would be right to say so.
  const libDirs = directoriesForGraph(ROOT, "library");
  const seg = libDirs.length > 0 ? basename(libDirs[0]!) : null;
  if (seg === null) {
    // No library directory declared by this instance — the uploads half alone
    // has nowhere to hang, and composing a name would be exactly the literal
    // the rule forbids.
    console.log("  · no library directory declared by this instance — nothing to publish");
    process.exit(0);
  }
  // ── Rule 1: a HANDLER rendering a kind's assets ────────────────────────
  //
  // Owner, 2026-09-20, reducing three cases to two:
  //
  //   > i want two rules.... not three. one is cat-harness handling the
  //   > library/ dir which has who-iris assets in it. one is who-iris handler
  //   > to mock current iris website.
  //
  // So the form is `<base>/<handler>/<kind>/<optional subject>` — which is the
  // owner's own first example, `<base>/cat-harness/docs/who-iris/`. The
  // handler is THIS instance (the machinery), the kind names what it renders,
  // and the subject scopes it to one instance's assets.
  //
  // **A subject page must NOT be published at `<base>/<subject>/<kind>/`.**
  // That is rule 2's namespace — `<base>/who-iris/` is who-iris presenting
  // ITSELF, mocking the IRIS website — and a viewer parked there would squat
  // on the instance's own site. An earlier draft of this file was about to do
  // exactly that.
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }
  const { pageDir, dataDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, seg);

  // THE FOLIO MOUNT, and the route pattern is composed from the very values
  // that decided where these pages go — so relocating the viewer moves the
  // pattern with it rather than leaving a second copy of the mount table to
  // disagree. `folio-mount.ts` owns the mechanism; this owns the route.
  //
  // Non-greedy up to `<handler>/<seg>/`, which is exactly what
  // `viewerPlacement` was handed. Correct under the bare site, under the
  // project baseurl, and under `/STAGING/<branch>/` — the four bases an
  // absolute URL would be right about once.
  //
  // DEFINED HERE, EMITTED BELOW. `main` emitted both artefacts on the next two
  // lines; this branch emits them after computing the per-page tile counts
  // (#863), so the definition stays where `main` put it and the emit stays
  // where the counts are. Keeping `main`'s emit as well would have written
  // each file twice, the second time without the counts — a clean-looking
  // resolution that silently drops this PR's whole subject.
  const folioMount = folioMountFragment(
    new RegExp(`^(.*?)${handler}\\/${seg}\\/`),
  );

  // One page per SUBJECT — the instances whose assets this handler renders.
  // Read from the entries and the queues rather than from the directory list,
  // so a declared-but-empty directory gets no page claiming to show it.
  const subjects = [...new Set([
    ...g.entries.map((e) => e.instance),
    ...g.queues.map((q) => q.instance),
  ])].sort();

  /**
   * Each page's tile count, keyed by the DECLARED directory id — #863.
   *
   * Matched on the page rather than composed from the subject name. The
   * declaration already names the exact page each directory is visualised by,
   * and this run already knows the exact page it is about to write, so the
   * match is an identity rather than a heuristic. `directoryByVisualisationRef`
   * carries the corpus that rules composition out.
   *
   * Counted FOR THE PAGE, which is the whole correction: the `library`
   * directory's page is the cat-harness-scoped one, so its count is
   * cat-harness's entries — zero — and not the eight entries the graph holds
   * across every instance.
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
  const refOf = (dirPath: string): string =>
    relative(REPO_ROOT, join(viewerPlacement(site, dirPath, seg).pageDir, "index.html"))
      .split(sep)
      .join("/");
  const scoped: Record<string, readonly [number, string]> = {};
  // The unit is pluralised HERE because `tile-count.ts` puts pluralisation on
  // the declarer: only it knows whether its unit pluralises regularly, and
  // `entry`/`entries` does not. A tile reading "1 entries" is a small thing
  // that makes a careful reader trust the number less.
  const entries = (n: number): readonly [number, string] =>
    [n, n === 1 ? "entry" : "entries"];
  const wholeId = byRef.get(refOf(`${handler}/${seg}`));
  if (wholeId !== undefined) scoped[wholeId] = entries(g.entries.length);
  for (const subject of subjects) {
    const id = byRef.get(refOf(`${handler}/${seg}/${subject}`));
    if (id === undefined) continue;
    scoped[id] = entries(g.entries.filter((e) => e.instance === subject).length);
  }

  emit(join(dataDir, "index.json"), JSON.stringify(projection(g, scoped), null, 2) + "\n");

  // ── PER-ENTRY BLOCK GRAPHS (bean `7nvr`) ──────────────────────────────
  //
  // One file per entry, fetched only when a reader opens that entry.
  //
  // NOT folded into `index.json`, and the numbers are the argument: the corpus
  // holds 1715 blocks over roughly a megabyte of JSON-LD, against a 44 KB
  // index. Inlining them would multiply the cost of the page that answers
  // "what is in here" by twenty-five, to serve the question "what is in THIS
  // one" — which a reader asks about one entry at a time, if at all.
  //
  // The library JSON-LD is not published to the site (checked: no
  // `library/<id>/manifest.jsonld` under the built tree), so the viewer cannot
  // simply fetch the source. A projection is the only thing it can read.
  for (const e of g.entries) {
    const blocks = readEntryBlocks(join(repoRoot, e.dir));
    // An entry with no blocks still gets a file. The alternative is a 404 the
    // viewer has to tell apart from a network failure, and "this entry has no
    // blocks" is a determined answer that deserves to be served as one.
    emit(
      join(dataDir, "entries", `${e.id}.json`),
      JSON.stringify({ $schema: "folio-library-entry/v1", id: e.id, blocks }, null, 2) + "\n",
    );
  }

  // ── AVATARS (bean `zrvt`) ─────────────────────────────────────────────
  //
  // Each entry's picture, COPIED under the site so it resolves wherever the
  // committed tree is served — the instance mount exists only on the built
  // site. `--check` compares BYTES, so a cover regenerated upstream and not
  // re-copied here is stale, never silently old.
  for (const e of g.entries) {
    if (!e.avatar) continue;
    emitBytes(join(site, e.avatar.href.slice(1)), readFileSync(join(repoRoot, e.avatar.src)));
  }
  emit(join(pageDir, "index.html"), viewerHtml(dataHref, "", folioMount));
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, seg);
    emit(join(sub.pageDir, "index.html"), viewerHtml(sub.dataHref, subject, folioMount));
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
      `  ${g.entries.length} entr(ies), ${g.queues.length} queue(s), ` +
        `${g.queues.reduce((n, q) => n + q.uningested, 0)} uningested, ` +
        `${subjects.length} subject page(s)`,
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run library:viz\``);
    process.exit(1);
  }
}
