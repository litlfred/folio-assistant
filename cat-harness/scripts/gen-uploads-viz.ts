#!/usr/bin/env bun
/**
 * A viewer over the intake QUEUE — the half of the library graph that is not
 * yet corpus.
 *
 * @module scripts/gen-uploads-viz
 * @graphNode none — a generator over the uploads half of the library graph
 *
 * Third sibling of `gen-schema-viz.ts` and `gen-library-viz.ts`, and the same
 * shape MINUS ONE PIECE: those two publish a projection and a viewer over it;
 * this publishes only the viewer, because the dataset it renders already
 * exists and must stay single. See "ONE DATASET, TWO VIEWERS" below.
 * Zero-dependency, under `<site>/<handler>/<graph>/`, fetching the projection
 * relative to its own location.
 *
 * ## Why this is a SEPARATE harness and not a tab on the library viewer
 *
 * `uploads` and `library` declared the SAME `coverage.visualiser`, so both
 * navbar tiles opened the library viewer and the uploads tile rendered the
 * library's entry count — 0 on this instance, while fifteen sources sat in the
 * queue beside it. Bean `v18c` tabled three ways out and the owner rejected
 * all three, because each assumed one page that two tiles reach:
 *
 * > uploads/ are not ingested, they are ingested into libray/. separate
 * > visualizations … actually funcionally different/behavior diffent so need
 * > distinct harness
 *
 * The falsification is in `gen-library-viz.ts` itself: it reads bib-slugs,
 * `sections/`, `structure.json` and the OCR three-state. A queue has none of
 * those, so "same harness, different theme" would mean teaching a corpus
 * browser to render a queue.
 *
 * And the repository already argued the split, in
 * `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md`:
 * uploads is the incoming queue and is **not greppable by the corpus
 * checklist**, library is L1 source content and is. That page also states what
 * this viewer is FOR, better than this comment would:
 *
 * > an un-ingested source is worse than an absent one, because it produces
 * > false confidence rather than a gap
 *
 * The corpus grep searches `library/` only, so a paper still sitting in
 * `uploads/` makes a clean grep read as *"nobody has done this"*. **The
 * library viewer cannot surface that by construction** — the thing this one
 * must show is exactly what is NOT in the library. That is the behavioural
 * difference, and it is why the headline here is the UNINGESTED count rather
 * than a total.
 *
 * ## ONE DATASET, TWO VIEWERS — and the first draft of this file got it wrong
 *
 * `state-visualizer.ts` records the ruling, from bean `flh4` / issue #618:
 * the queue block is published inside `assets/library/index.json`,
 *
 * > one dataset with `library/`, since two projections over it would be two
 * > answers to "how many are queued"
 *
 * This file's first draft emitted its own `assets/uploads/index.json`. Derived
 * from the same reader, so it could not have DISAGREED on the day it was
 * written — and that is the whole trap: a second file over one reading cannot
 * be wrong until the day one of them is regenerated and the other is not, at
 * which point two pages state different counts and neither says which is
 * stale.
 *
 * So this emits NO projection. It publishes a viewer that fetches the library
 * projection and renders its queue half. `library:viz` owns the dataset;
 * this owns a rendering of it — which is the same split `gen-library-viz`
 * already uses for its own Listing and Desktop views, applied across two
 * harnesses instead of two tabs.
 *
 * A distinct harness was never a claim about the DATA. It is a claim about
 * behaviour, and the behaviour is what this file holds.
 *
 * ## Three states, not a tick and a cross
 *
 * `waiting` and `ingested` are the two the reader can determine. The third is
 * `sidecar-free`: an intake DIRECTORY declares which files are the capture, so
 * a loose file and a declared intake are different units and are labelled as
 * such rather than both being counted as "a document". Counting the four files
 * of one IRIS intake as four queued documents is the exact error
 * `UploadItem.kind` exists to stop.
 *
 * Usage:
 *   bun run uploads:viz          # write
 *   bun run uploads:viz:check    # fail if either artefact is stale
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { readLibraryGraph, type UploadItem } from "./library-graph.ts";
import { viewerPlacement } from "./gen-schema-viz.ts";
import {
  directoriesForGraph,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  siteDirFor,
} from "../schemas/cat-harness.ts";
import "../schemas/folio-graph-kind.js";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");
let stale = 0;

/** `waiting` | `ingested` — the two the reader can determine. */
export function itemState(u: UploadItem): "waiting" | "ingested" {
  return u.ingestedBy ? "ingested" : "waiting";
}

/**
 * The viewer. Zero dependencies, fetches its projection by a RELATIVE href so
 * the same bytes serve the canonical deploy and a STAGING preview — the
 * baseurl lesson #801 paid for, one layer along.
 */
export function viewerHtml(dataHref: string, scope = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>uploads — the intake queue</title>
<!--
  Generated by scripts/gen-uploads-viz.ts. Do not hand-edit: the next run
  overwrites it and \`uploads:viz:check\` fails on the difference.
-->
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1f2328;--mut:#57606a;--line:#d0d7de;--card:#f6f8fa;
      --wait:#9a6700;--waitbg:#fff8c5;--ing:#1a7f37;--ingbg:#dafbe1}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--mut:#8b949e;--line:#30363d;
      --card:#161b22;--wait:#d29922;--waitbg:#2d2200;--ing:#3fb950;--ingbg:#0f2913}}
body{margin:0;background:var(--bg);color:var(--fg);
     font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:70rem;margin:0 auto;padding:1.5rem 1rem 4rem}
h1{font-size:1.5rem;margin:0 0 .25rem}
.sub{color:var(--mut);margin:0 0 1.25rem}
.badges{display:flex;gap:.75rem;flex-wrap:wrap;margin:0 0 1.5rem}
.badge{background:var(--card);border:1px solid var(--line);border-radius:.5rem;padding:.6rem .9rem;min-width:7rem}
.badge b{display:block;font-size:1.6rem;line-height:1.1}
.badge span{color:var(--mut);font-size:.8rem}
.badge.lead b{color:var(--wait)}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:.45rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}
th{cursor:pointer;user-select:none;white-space:nowrap;color:var(--mut);font-weight:600}
th:hover{color:var(--fg)}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.pill{display:inline-block;border-radius:1rem;padding:.05rem .55rem;font-size:.78rem;font-weight:600}
.pill.waiting{background:var(--waitbg);color:var(--wait)}
.pill.ingested{background:var(--ingbg);color:var(--ing)}
.kind{color:var(--mut);font-size:.78rem}
.empty{background:var(--card);border:1px dashed var(--line);border-radius:.5rem;padding:1.5rem;color:var(--mut)}
code{background:var(--card);padding:.05rem .3rem;border-radius:.25rem;font-size:.85em}
</style>
</head>
<body>
<main>
<h1>uploads — the intake queue</h1>
<p class="sub">Raw files as dropped, before ingestion. A source here is <strong>not</strong>
reachable by the corpus checklist, which searches <code>library/</code> only — so a file
waiting here makes a clean grep read as &ldquo;nobody has done this&rdquo;.</p>
<div class="badges" id="badges"></div>
<div id="body"></div>
</main>
<script>
var SRC = ${JSON.stringify(dataHref)};
var SCOPE = ${JSON.stringify(scope)};
function $(i){ return document.getElementById(i); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function size(n){ return n >= 1048576 ? (n/1048576).toFixed(1)+" MB" : Math.round(n/1024)+" KB"; }
function inScope(x){ return !SCOPE || x.instance === SCOPE; }
function state(u){ return u.ingestedBy ? "ingested" : "waiting"; }

var ITEMS = [], QUEUES = [], sortKey = "state", sortAsc = true;

var COLS = [
  { k:"file",    t:"File",     num:false },
  { k:"kind",    t:"Unit",     num:false },
  { k:"state",   t:"State",    num:false },
  { k:"ext",     t:"Type",     num:false },
  { k:"bytes",   t:"Size",     num:true  },
  { k:"instance",t:"Queue",    num:false }
];

function cell(u, k){
  if (k === "state") {
    var s = state(u);
    return '<span class="pill '+s+'">'+s+'</span>' +
      (u.ingestedBy ? ' <span class="kind">'+esc(u.ingestedBy)+'</span>' : '');
  }
  if (k === "kind") {
    return '<span class="kind">'+esc(u.kind)+
      (u.kind === "intake" && u.declaredFiles ? ' &middot; '+u.declaredFiles+' file(s)' : '')+'</span>';
  }
  if (k === "bytes") return size(u.bytes);
  if (k === "file") {
    return esc(u.file) + (u.title ? '<br><span class="kind">'+esc(u.title)+'</span>' : '');
  }
  if (k === "ext") return u.ext ? '<code>'+esc(u.ext)+'</code>' : '<span class="kind">&mdash;</span>';
  return esc(u[k]);
}

function sorted(){
  var rows = ITEMS.filter(inScope).slice();
  rows.sort(function(a,b){
    var x = sortKey === "state" ? state(a) : a[sortKey];
    var y = sortKey === "state" ? state(b) : b[sortKey];
    if (typeof x === "number" && typeof y === "number") return sortAsc ? x-y : y-x;
    x = String(x).toLowerCase(); y = String(y).toLowerCase();
    return sortAsc ? (x<y?-1:x>y?1:0) : (x<y?1:x>y?-1:0);
  });
  return rows;
}

function render(){
  var qs = QUEUES.filter(inScope);
  var waiting = qs.reduce(function(n,q){ return n + q.uningested; }, 0);
  var total   = qs.reduce(function(n,q){ return n + q.total; }, 0);
  var ingested= qs.reduce(function(n,q){ return n + q.ingested; }, 0);
  // The uningested count LEADS, because it is the one that makes a clean
  // corpus grep lie. A total would read as reassurance.
  $("badges").innerHTML =
    '<div class="badge lead"><b>'+waiting+'</b><span>waiting to be ingested</span></div>' +
    '<div class="badge"><b>'+ingested+'</b><span>ingested into library/</span></div>' +
    '<div class="badge"><b>'+total+'</b><span>queued units</span></div>' +
    '<div class="badge"><b>'+qs.length+'</b><span>queue(s)</span></div>';

  var rows = sorted();
  if (!rows.length) {
    // An empty queue is a DETERMINED answer and is not an error: nothing is
    // waiting. It is rendered as calm rather than as a gap.
    $("body").innerHTML = '<div class="empty">Nothing in the queue. Every source that arrived has been ingested into <code>library/</code>.</div>';
    return;
  }
  var h = '<table><thead><tr>' + COLS.map(function(c){
    var mark = sortKey === c.k ? (sortAsc ? " \\u25b4" : " \\u25be") : "";
    return '<th class="'+(c.num?"num":"")+'" data-k="'+c.k+'">'+c.t+mark+'</th>';
  }).join("") + '</tr></thead><tbody>';
  h += rows.map(function(u){
    return '<tr>' + COLS.map(function(c){
      return '<td class="'+(c.num?"num":"")+'">'+cell(u,c.k)+'</td>';
    }).join("") + '</tr>';
  }).join("");
  $("body").innerHTML = h + '</tbody></table>';
  Array.prototype.forEach.call(document.querySelectorAll("th[data-k]"), function(th){
    th.addEventListener("click", function(){
      var k = th.getAttribute("data-k");
      if (k === sortKey) sortAsc = !sortAsc; else { sortKey = k; sortAsc = true; }
      render();
    });
  });
}

fetch(SRC).then(function(r){ return r.json(); }).then(function(d){
  // The library projection, read for its QUEUE HALF ONLY. "d.entries" is
  // deliberately untouched: rendering it here is how this becomes a second
  // library viewer, which is the thing the owner ruled against.
  // (No backticks in this comment on purpose -- it lives INSIDE the generator's
  //  template literal, where one would end the string. It already did once.)
  ITEMS = d.uploads || []; QUEUES = d.queues || []; render();
}).catch(function(e){
  // A failed fetch and an empty queue are OPPOSITE facts and must not look
  // alike — the same rule the todo board states for its own index.
  $("body").innerHTML = '<div class="empty">Could not read the queue projection (<code>'+esc(SRC)+
    '</code>). This is not the same as an empty queue.</div>';
  console.error(e);
});
</script>
</body>
</html>
`;
}

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
  const repoRoot = repoRootFor(ROOT);
  const site = join(ROOT, siteDirFor(ROOT));
  const g = readLibraryGraph(instanceRootsIn(repoRoot));
  if (g === null) {
    console.log("  · no library graph could be read — nothing to publish");
    process.exit(0);
  }

  // The published segment is the DECLARED directory's own name, read rather
  // than written down, so a rename moves the source and the URL together —
  // the rule `gen-library-viz` states and the one `#801` is a case of.
  const upDirs = directoriesForGraph(ROOT, "uploads");
  const seg = upDirs.length > 0 ? basename(upDirs[0]!) : null;
  if (seg === null) {
    console.log("  · no uploads directory declared by this instance — nothing to publish");
    process.exit(0);
  }
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }

  // `kind` is `library`, NOT `seg`. That is what makes the href point at the
  // ONE dataset rather than minting a second — see the header. The PAGE still
  // sits on the uploads route, so the tile opens a queue view.
  const { pageDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, "library");
  emit(join(pageDir, "index.html"), viewerHtml(dataHref));

  // One page per SUBJECT — read from the QUEUES rather than from the declared
  // directory list, so a declared-but-empty uploads directory gets no page
  // claiming to show it. `dh4f`, one layer along.
  const subjects = [...new Set(g.queues.map((q) => q.instance))].sort();
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, "library");
    emit(join(sub.pageDir, "index.html"), viewerHtml(sub.dataHref, subject));
  }

  if (!check) {
    const waiting = g.queues.reduce((n, q) => n + q.uningested, 0);
    console.log(
      `  ${g.queues.length} queue(s), ${g.uploads.length} queued unit(s), ` +
        `${waiting} waiting, ${subjects.length} subject page(s)`,
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run uploads:viz\``);
    process.exit(1);
  }
}
