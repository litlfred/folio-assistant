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
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";

import { readLibraryGraph, type LibraryGraph, type LibraryBlock,
  readEntryBlocks,
} from "./library-graph.ts";
import { tally } from "./summaries.ts";
import { WITHHELD_VIEW_JS } from "./lib/library-withheld-view.ts";
import { DOCUMENT_VIEW_JS, readEntryDocument } from "./lib/library-document.ts";
import { EDIT_LINKS_RUNTIME } from "../src/core/edit-links.ts";
import { ADDRESS_JS } from "./lib/library-address.ts";
import { LIBRARY_JSONLD_SITE_DIR, libraryAssetSitePath } from "../schemas/library-iri.ts";
import { scanLibraryRefs, type RefSource } from "./library-refs.ts";
import { orphanSubjectPages, viewerPlacement } from "./gen-schema-viz.ts";
import { readDeclaration } from "../schemas/cat-harness.ts";
import { instanceRootsIn, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { directoryByVisualisationRef } from "./graph-tiles.ts";
import { tileCounts } from "../schemas/tile-count.js";
import { itemState } from "./gen-uploads-viz.ts";
import { makeEmit } from "./viewer-page.ts";
import { escHtml, thinPageConfigOf } from "./thin-page.ts";
import { renderedPath, withRendersFrontMatter, withViewers } from "./viewer-declarations.js";
import { corpusDirectoriesForGraph } from "../schemas/harness-config.js";

/** This generator's Tool node (`tools/viewers.ts`), named on every page it draws. */
const VIEWER_TOOL = "library-viewer";

const ROOT = join(import.meta.dir, "..");
const REPO_ROOT = repoRootFor(ROOT);
const check = process.argv.includes("--check");
/** The GitHub repository the entries' source and feedback links point into. */
const LINK_REPO = (() => {
  const d = readDeclaration(ROOT) as { livesAt?: { repository?: string }; repository?: string } | undefined;
  return d?.livesAt?.repository ?? d?.repository;
})();

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
 * The viewer's stylesheet — published ONCE at `assets/library/viewer.css` and
 * referenced by every library page, so a page is a shell rather than a copy
 * (owner, 2026-10-02, #1881).
 *
 * SCOPED to `.lib-page` since 2026-10-07, when the pages moved onto the
 * theme's layout ({@link libraryPageHtml}): no rule on `body`, `:root` or
 * `a`, and the palette keyed on the scheme the site paints.
 */
export const VIEWER_CSS = `/* The block content panel — bean lrmo. Tokens only, so it follows the light
   and dark palettes below rather than hardcoding either. */
.lib-page #document .seg { margin: .2rem 0 .8rem; }
.lib-page #document .seg button[aria-selected="true"] { font-weight: 600; }
.lib-page #document .docbody { padding: 0 16px 8px; }
.lib-page #document .dockw { padding: 4px 16px; }
.lib-page #document p.kw, .lib-page #document .dockw p.kw { display: inline; margin: 0; }
.lib-page #document .docsec p.kw { display: block; margin: 2px 0 6px; }
.lib-page #document p.kw .pill { margin: 0 2px 2px 0; }
.lib-page #document ul.toc, .lib-page #document ul.toc ul { list-style: none; margin: 0; padding-left: 1.1rem; }
.lib-page #document ul.toc { padding-left: 0; }
.lib-page #document ul.toc li { margin: .15rem 0; }
.lib-page #document ul.toc li.leaf { padding-left: 1rem; }
.lib-page #document ul.toc summary { cursor: pointer; }
.lib-page #document td ul { margin: .3rem 0 0; padding-left: 1.1rem; }
.lib-page #document .docsec { margin: 0 0 1rem; }
.lib-page #document .docsec h3 { margin: .2rem 0 .3rem; font-size: 1rem; }
.lib-page #document .sum { padding: .55rem .7rem; border: 1px dashed var(--line); border-radius: 6px; }
.lib-page #document .sum p { margin: .35rem 0 0; }
.lib-page #document td { white-space: normal; vertical-align: top; }
.lib-page #blocks details > summary { cursor: pointer; }
.lib-page #blocks .block-body { margin: .4rem 0 .2rem; }
.lib-page #blocks .block-body pre {
  white-space: pre-wrap; word-break: break-word; margin: 0;
  padding: .55rem .7rem; background: var(--panel); border: 1px solid var(--line);
  border-radius: 6px; font-size: 12.5px; line-height: 1.45; max-height: 22rem; overflow: auto;
}
.lib-page #blocks .block-body .note { margin: .35rem 0 0; font-size: 11.5px; color: var(--muted); }
/* EXTRACT AND AGENT SUMMARY, SIDE BY SIDE -- owner, 2026-09-24: "the extract
   of a node is shown, but no agentic summary". Beside, never instead: the
   extract is the source's words and the summary is an agent's account of
   them, so a reader must be able to hold one against the other. Two columns
   where there is room, stacked on a phone, extract first either way. */
.lib-page #blocks td { white-space: normal; vertical-align: top; }
.lib-page #blocks td.bt { min-width: 15rem; }
.lib-page #blocks .pair { display: grid; grid-template-columns: 1fr; gap: .6rem; }
@media (min-width: 760px) { .lib-page #blocks .pair { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.lib-page #blocks .pair > div { min-width: 0; }
.lib-page #blocks .lbl { margin: 0 0 .3rem; font-size: 11.5px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .04em; }
.lib-page #blocks .sum { padding: .55rem .7rem; border: 1px dashed var(--line); border-radius: 6px;
  font-size: 13px; line-height: 1.5; }
.lib-page #blocks .sum p { margin: .35rem 0 0; }
/* A WITHHELD ENTRY -- issue #1794. Said in words, styled as information
   rather than as an error: not publishing a refused work is the system
   working, and the banner is there so it is not mistaken for a gap. */
.lib-page #blocks .wh-banner { margin: 8px 16px 12px; padding: .6rem .8rem; border: 1px solid var(--info);
  background: var(--info-soft); border-radius: 8px; font-size: .86rem; line-height: 1.5; }
.lib-page #blocks .wh-banner p { margin: 0 0 .35rem; }
.lib-page #blocks .wh-banner p:last-child { margin: 0; }
.lib-page #blocks .wh-line { color: var(--muted); font-size: .8rem; }
/* THEMED, since 2026-10-07: every library page sits on the site's default
   layout, inside the theme's content column, so this sheet styles ONE
   wrapper. Every selector starts .lib-page, and there is no rule on body,
   :root or a -- a rule there would restyle the theme on every page that
   shares this file's reader. The palette is keyed on the scheme the SITE
   paints (data-fa-scheme on html, set by head_custom.html's first-paint
   block and by docs-ui.js's toggle), so it follows the reader's choice
   rather than the OS alone. Dark is the default because the site's is.
   --bg is the theme's own ground, which a sticky header must paint over. */
.lib-page {
  --bg:#27262b; --fg:#e8eaed; --muted:#a9b0b8; --line:#4a4950; --panel:#1f1e23;
  --accent:#7fc7a1; --accent-soft:#16291f; --warn:#e0b25e; --warn-soft:#2a2213;
  --info:#8db4ec; --info-soft:#1d2937; --box:#1f1e23;
}
html[data-fa-scheme="light"] .lib-page {
  --bg:#fff; --fg:#17191c; --muted:#5b6168; --line:#d9dde2; --panel:#f6f7f9;
  --accent:#276749; --accent-soft:#e6f2ec; --warn:#8a5300; --warn-soft:#fdf3e0;
  --info:#1a5fb4; --info-soft:#e7eefb; --box:#fff;
}
.lib-page, .lib-page * { box-sizing:border-box; }
/* The theme's list bullet is drawn by li::before in .main-content; the
   table of contents is a tree, not a bulleted list. */
.lib-page ul.toc li::before { content:none; }
.lib-page .lib-head { padding:16px 0; border-bottom:1px solid var(--line); }
.lib-page h1 { margin:0 0 6px; }
.lib-page .badges { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 0; }
.lib-page .badge { border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-size:.82rem; background:var(--panel); }
.lib-page .badge b { font-variant-numeric:tabular-nums; }
.lib-page .badge.q b { color:var(--warn); }
.lib-page .toolbar { padding:10px 0; display:flex; flex-wrap:wrap; gap:8px; align-items:center; border-bottom:1px solid var(--line); }
.lib-page input, .lib-page select, .lib-page button { font:inherit; color:var(--fg); background:var(--box);
  border:1px solid var(--line); border-radius:6px; padding:6px 9px; }
.lib-page input { flex:1 1 200px; min-width:0; }
.lib-page .seg { display:inline-flex; border:1px solid var(--line); border-radius:6px; overflow:hidden; }
.lib-page .seg button { border:0; border-radius:0; background:transparent; cursor:pointer; padding:6px 12px; }
.lib-page .seg button[aria-pressed="true"] { background:var(--accent-soft); color:var(--fg); font-weight:600; }
.lib-page .lib-main { padding:0 0 40px; }
.lib-page table { border-collapse:collapse; width:100%; font-size:.86rem; }
/* min-width, border-left, background and font-size undo the theme's own
   cell rules, which are type selectors and so lose to these. */
.lib-page th, .lib-page td { text-align:left; padding:7px 10px; border:0; border-bottom:1px solid var(--line); white-space:nowrap;
  min-width:0; background:transparent; font-size:inherit; }
.lib-page th { position:sticky; top:0; background:var(--bg); color:var(--muted); font-size:.74rem;
  text-transform:uppercase; letter-spacing:.04em; }
.lib-page th button { border:0; background:transparent; padding:0; font:inherit; color:inherit;
  cursor:pointer; text-transform:inherit; letter-spacing:inherit; }
.lib-page th button:hover { color:var(--fg); text-decoration:underline; }
.lib-page th[aria-sort] button::after { content:" ▲"; }
.lib-page th[aria-sort="descending"] button::after { content:" ▼"; }
.lib-page td.num { text-align:right; font-variant-numeric:tabular-nums; }
.lib-page tbody tr:hover { background:var(--panel); }
.lib-page .slug { font-family:ui-monospace, Menlo, monospace; }
/* A row's secondary links -- source, README, a referenced entry's own -- are
   24 px targets (WCAG 2.5.8). As plain inline text they were 16 px tall and
   sat closer than 24 px to the title link beside them. */
.lib-page a.src { display:inline-block; min-width:24px; min-height:24px; line-height:24px; }
.lib-page .pill { display:inline-block; font-size:.7rem; padding:1px 7px; border-radius:999px;
  border:1px solid var(--line); color:var(--muted); }
.lib-page .pill.ok { color:var(--accent); background:var(--accent-soft); border-color:var(--accent); }
.lib-page .pill.warn { color:var(--warn); background:var(--warn-soft); border-color:var(--warn); }
.lib-page .pill.info { color:var(--info); background:var(--info-soft); border-color:var(--info); }
.lib-page #desktop { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));
  gap:14px; padding:16px; }
.lib-page .card { border:1px solid var(--line); border-radius:10px; background:var(--panel);
  padding:12px; display:flex; flex-direction:column; gap:6px; }
.lib-page .card h3 { margin:0; font-size:.92rem; line-height:1.3; }
.lib-page .card .slug { font-size:.74rem; color:var(--muted); }
.lib-page .card .rows { font-size:.78rem; color:var(--muted); display:grid;
  grid-template-columns:auto 1fr; gap:1px 8px; margin-top:2px; }
.lib-page .card .rows b { color:var(--fg); font-weight:600; font-variant-numeric:tabular-nums; }
.lib-page .card .tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.lib-page .spine { height:6px; border-radius:3px; background:var(--accent); opacity:.65; }
.lib-page .empty { color:var(--muted); padding:24px 16px; }
.lib-page h2 { font-size:.95rem; margin:24px 0 4px; }
.lib-page p.note { color:var(--muted); font-size:.82rem; margin:0 0 8px; }
.lib-page .wrap { overflow:auto; }
/* THE BOOK'S AVATAR, first in its row -- bean zrvt, issue #1006. A fixed box
   so a row does not reflow when the cover arrives, and a glyph of the same
   size when there is no picture, so "no cover" never looks like a broken one. */
.lib-page .lib-ava { display:inline-flex; align-items:center; justify-content:center;
  width:34px; height:46px; margin-right:8px; vertical-align:middle; flex:0 0 auto;
  border:1px solid var(--line); background:var(--panel); overflow:hidden; }
.lib-page .lib-ava img { width:100%; height:100%; object-fit:cover; display:block; }
.lib-page .lib-ava svg { width:22px; height:22px; fill:none; stroke:var(--muted); stroke-width:1.6; }
.lib-page td.lib-first { white-space:nowrap; }
.lib-page .card .lib-ava { width:56px; height:76px; }
/* THE LISTING FITS MORE OF ITSELF, AND SAYS WHEN IT DOES NOT -- bean gnqa,
   findings 1 and 2. Measured 2026-10-02 at 1280 px: a 3636 px table in a
   1224 px box, every cell nowrap, so the title and source path alone were
   2,000 px and nine of thirteen columns sat past the right edge with
   nothing on screen saying so. The long TEXT cells now wrap inside a
   bounded width; the short numeric and pill cells keep nowrap, because a
   count broken over two lines is harder to read than one scrolled to. */
.lib-page #listing td.lib-first { white-space:normal; min-width:13rem; max-width:17rem; }
.lib-page #listing td.lib-first .slug { overflow-wrap:anywhere; }
.lib-page #listing td.t-title { white-space:normal; min-width:14rem; max-width:22rem; }
.lib-page #listing td.t-source { white-space:normal; min-width:9rem; max-width:14rem; }
.lib-page #listing td.t-source .slug { overflow-wrap:anywhere; }
.lib-page #listing td.t-source .pill { white-space:nowrap; }
.lib-page #queue td.slug { white-space:normal; overflow-wrap:anywhere; min-width:12rem; max-width:24rem; }
/* "Referenced by" OPENS rather than hovers -- finding 6. A title tooltip is
   unreachable by touch and by keyboard; a details element is both. */
.lib-page details.refs > summary { cursor:pointer; list-style:none; display:inline-flex; align-items:center; min-height:28px; }
.lib-page details.refs > summary::-webkit-details-marker { display:none; }
.lib-page details.refs > summary .pill::after { content:" \\25B8"; }
.lib-page details.refs[open] > summary .pill::after { content:" \\25BE"; }
.lib-page details.refs ul { margin:.3rem 0 0; padding-left:1rem; font-size:.72rem; color:var(--muted);
  white-space:normal; overflow-wrap:anywhere; max-width:22rem; }
/* THE EDGE CUE AT DESKTOP WIDTH. narrow-viewport.css fades a table's
   overflowing edge below 800 px; above it the scroll box is .wrap, and it
   had mask-image none. Same mask, same scroll-driven animation, so a box
   that does not overflow shows no fade. */
@media (min-width: 800px) {
  /* The entry's identity stays in view while the reader scrolls to its
     numbers: the first column is pinned to the scroll box's left edge. */
  .lib-page #listing th:first-child, .lib-page #listing td.lib-first { position:sticky; left:0; z-index:1;
    background:var(--bg); box-shadow:1px 0 0 var(--line); }
  .lib-page #listing th:first-child { z-index:2; }
  @supports (animation-timeline: scroll()) {
    /* Right edge only: the pinned first column already shows what is to
       the left, and a left fade would dim the entry's own name. */
    .lib-page #listing.wrap, .lib-page #queue.wrap {
      mask-image: linear-gradient(to right,
        #000 calc(100% - var(--fa-cue-r)), transparent 100%);
      animation: fa-scroll-cue linear both;
      animation-timeline: scroll(self inline);
    }
  }
}
/* ON A PHONE A ROW IS A CARD -- finding 2. At 390 px a sideways-scrolling
   table showed one column of thirteen: the cover, the slug and a button,
   none of the metadata the listing exists for. Each row now lays its cells
   out in a two-column grid, every cell labelled from its own header, and
   the header row stays as the SORT controls. Overrides narrow-viewport.css
   by id, which outranks its type selector. */
@media (max-width: 799.98px) {
  .lib-page #listing table, .lib-page #queue table { display:block; mask-image:none; animation:none; overflow:visible; }
  .lib-page #listing thead, .lib-page #queue thead, .lib-page #listing tbody, .lib-page #queue tbody { display:block; }
  .lib-page #listing thead tr, .lib-page #queue thead tr { display:flex; flex-wrap:wrap; gap:2px 12px; padding:6px 10px; }
  .lib-page #listing thead th, .lib-page #queue thead th { position:static; border:0; padding:2px 0; }
  .lib-page #listing thead tr::before { content:"Sort by"; font-size:.74rem; color:var(--muted); align-self:center; }
  .lib-page #listing tbody tr, .lib-page #queue tbody tr { display:grid; grid-template-columns:1fr 1fr; gap:2px 10px;
    padding:10px; border-bottom:1px solid var(--line); }
  .lib-page #listing tbody td, .lib-page #queue tbody td { display:block; border:0; padding:2px 0; white-space:normal;
    min-width:0; max-width:none; text-align:left; overflow-wrap:anywhere; }
  .lib-page #listing td.lib-first, .lib-page #listing td.t-title, .lib-page #listing td.t-source, .lib-page #listing td.t-refs, .lib-page #queue td.slug { grid-column:1 / -1; }
  .lib-page #listing td[data-label]::before, .lib-page #queue td[data-label]::before { content:attr(data-label);
    display:block; font-size:.66rem; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); }
  .lib-page #listing td.lib-first::before, .lib-page #listing td.t-title::before { content:none; }
}
`;

/**
 * The viewer's script — published ONCE at `assets/library/viewer.js`.
 *
 * NO BACKTICKS INSIDE IT — not in strings, not in comments. It is one template
 * literal, so a backtick terminates it and the rest becomes TypeScript; that
 * has happened twice. `viz-generators.test.ts` imports this module, so a stray
 * one reddens the suite rather than only the generator.
 */
export const VIEWER_JS = `"use strict";
var G = null, SORT = { key: "id", dir: 1 }, VIEW = "list";
/* THE PAGE'S IDENTITY, and the only thing a page carries -- owner,
   2026-10-02 (#1881): every page is a thin shell that loads its content from
   the published assets. A JSON data block rather than script, so a shell
   holds no code of its own. DATA_HREF is made ABSOLUTE here, once, before
   anything can rewrite the address bar (see honourAddress). */
var CONFIG = (function(){
  var el = document.getElementById("fa-library-config");
  try { return JSON.parse(el ? el.textContent : "{}") || {}; } catch (_e) { return {}; }
})();
var DATA_HREF = new URL(String(CONFIG.data || ""), location.href).href;
/* The SUBJECT this page is scoped to, or "" for the handler's whole view.
   One projection serves both — a second JSON per subject would be the same
   facts written N+1 times, free to disagree the moment one is regenerated. */
var SCOPE = typeof CONFIG.scope === "string" ? CONFIG.scope : "";
function inScope(x){ return !SCOPE || x.instance === SCOPE; }
/* THE SITE ROOT, derived from the projection's own relative address rather
   than declared -- the page is served at more than one depth, and DATA_HREF
   is already the one path that is right at every one of them. */
var SITE_ROOT = new URL(DATA_HREF.slice(0, DATA_HREF.length - "assets/library/index.json".length)).pathname;
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
/* A REFERENCED entry's own links -- the published IG, this site's artefact
   index. Owner, 2026-10-02. An entry recorded by reference holds nothing to
   open, so without these its row names a thing and goes nowhere. A site path
   (leading slash) is composed against SITE_ROOT like an avatar; anything
   else must be http(s), so a record cannot put a script URL in an href. */
function linkHref(h){
  h = typeof h === "string" ? h : "";
  if (h.charAt(0) === "/") return SITE_ROOT + h.slice(1);
  return /^https?:[/][/]/i.test(h) ? h : "";
}
function linksHtml(e){
  return (e.links || []).map(function(l){
    var h = linkHref(l.href);
    return h ? ' <a class="src" href="' + esc(h) + '">' + esc(l.label) + "</a>" : "";
  }).join("");
}
/* EVERY ENTRY HAS ITS OWN IRI, AND IT IS A PATH -- owner, 2026-10-02
   (#1881): "each asset gets its own IRI", "no query strings", materialized
   on gh-pages rather than routed by a 404. The generator writes a shell at
   <library>/<instance>/<id>/ for every entry, so a row links there. LIB_ROOT
   is the library's own directory, given relative to the page by CONFIG and
   resolved once against where the page was LOADED. */
var LIB_ROOT = new URL(String(CONFIG.libRoot || "./"), location.href).pathname;
${ADDRESS_JS}
function entryHref(e){
  return LIB_ROOT + encodeURIComponent(e.instance) + "/" + encodeURIComponent(e.id) + "/";
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
  /* THE SLUG OPENS THE ENTRY'S VISUALISER -- e.view, generated per entry by
     the projection (owner, 2026-10-02: "click on smart-trust slug and open
     up the visualizer"). A site-root path, composed like an avatar; an entry
     whose projection carries none keeps a plain slug. */
  { k:"id",       t:"slug",     n:false, f:function(e){
      var v = typeof e.view === "string" && e.view.charAt(0) === "/" ? SITE_ROOT + e.view.slice(1) : "";
      var s = '<span class="slug">'+esc(e.id)+"</span>";
      return avatarHtml(e) + (v ? '<a class="lib-view" href="'+esc(v)+'">'+s+"</a>" : s); } },
  /* Bean qgjh: an entry can be OPENED. The title is a link to the item's own
     page (its generated README) where one exists, and the document's upstream
     record rides beside it: arXiv or DOI, from the identifier its manifest
     records. Nothing is linked that the projection does not carry. */
  { k:"title",    t:"title",    n:false, c:"t-title", f:function(e){
      /* THE TITLE OPENS THE ENTRY'S OWN PAGE -- its path IRI (#1881). It
         used to open the item's README on GitHub, which a referenced entry
         may not have (owner, 2026-10-02: the smart-trust title went to a
         404). The README stays as a secondary link, only when one exists. */
      var t = '<a class="lib-title" href="'+esc(entryHref(e))+'">'+esc(e.title)+"</a>";
      var src = e.arxiv ? "https://arxiv.org/abs/"+encodeURIComponent(e.arxiv) : e.doi ? "https://doi.org/"+e.doi : "";
      return t + (src ? ' <a class="src" href="'+esc(src)+'">source</a>' : "") +
        (e.readme ? ' <a class="src" href="'+esc(e.readme)+'">README</a>' : "") + linksHtml(e);
    } },
  { k:"instance", t:"instance", n:false, f:function(e){ return '<span class="pill">'+esc(e.instance)+"</span>"; } },
  { k:"rung",     t:"rung",     n:false, f:function(e){ return '<span class="pill '+(e.rung==="none"?"warn":"ok")+'">'+esc(e.rung)+"</span>"; } },
  { k:"sections", t:"sections", n:true },
  { k:"blocks",   t:"blocks",   n:true },
  { k:"images",   t:"images",   n:true },
  { k:"ocrPages", t:"ocr",      n:true, f:function(e){ var s=ocrState(e); return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"; } },
  { k:"pageEnd",  t:"pages",    n:true, f:function(e){ return e.pageStart==null?'<span class="pill">—</span>':esc(e.pageStart+"–"+e.pageEnd); } },
  { k:"words",    t:"words",    n:true, f:function(e){ return e.words.toLocaleString(); } },
  { k:"bytes",    t:"size",     n:true, f:function(e){ return kb(e.bytes); } },
  { k:"refCount", t:"referenced by", n:true, c:"t-refs", f:function(e){ var s=refState(e);
      /* The referencing files used to ride in a title attribute, which touch
         and keyboard readers cannot reach (bean gnqa, finding 6). A details
         element is focusable and opens on tap, Enter or Space. */
      var refs = e.referencedBy || [];
      var pill = '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>";
      if (!refs.length) return pill;
      return '<details class="refs"><summary>'+pill+'</summary><ul>' + refs.map(function(r){
        return "<li>"+esc(r.from)+" ("+r.count+")</li>"; }).join("") + "</ul></details>"; } },
  { k:"upload",   t:"source",   n:false, c:"t-source", f:function(e){ var s=uploadState(e);
      return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"+(e.sourceFile?'<br><span class="slug" style="font-size:.72rem;color:var(--muted)">'+esc(e.sourceFile)+"</span>":""); } }
];

function rows(){
  var q = $("q").value.trim().toLowerCase();
  var r = G.entries.filter(function(e){
    if (!inScope(e)) return false;
    if (!q) return true;
    return (e.id+" "+e.title+" "+(e.extractedTitle||"")+" "+e.sourceFile+" "+e.docId+" "+e.instance).toLowerCase().indexOf(q) >= 0;
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
       deriving its root, applied one level in.

       Since 2026-10-02 the address is the entry's PATH (entryHref above),
       which the generator backs with a page that lands on this same anchor
       -- so the anchor is still the contract, and the path is a name a
       person can type and share. */
    var href = entryHref(e);
    /* data-fa-pullout-host puts the pull-out control in the FIRST cell.
       It used to land in the last one, which on a table wider than the
       screen is past its right edge -- the owner could not find a way onto
       the glass at all (issue #1006). */
    return '<tr data-fa-library-item="' + esc(key) + '"' +
      ' data-fa-library-href="' + esc(href) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '">' + COLS.map(function(c, i){
      var cls = i === 0 ? "lib-first" : [c.n ? "num" : "", c.c || ""].join(" ").trim();
      return "<td" + (cls ? ' class="'+cls+'"' : "") + (i === 0 ? " data-fa-pullout-host" : "") +
        ' data-label="'+esc(c.t)+'">' + (c.f ? c.f(e) : esc(e[c.k])) + "</td>";
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
      ' data-fa-library-href="' + esc(entryHref(e)) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '"><div class="spine"></div>' +
      '<div data-fa-pullout-host style="display:flex;gap:8px;align-items:flex-start">' + avatarHtml(e) +
      "<h3>"+esc(e.title)+"</h3></div>" +
      '<div class="slug">'+esc(e.instance)+" / "+esc(e.id)+"</div>" +
      '<div class="rows">' +
        "<span>sections</span><b>"+e.sections+"</b>" +
        "<span>blocks</span><b>"+e.blocks+"</b>" +
        (e.summaries && e.summaries.prose ? "<span>summarised</span><b>"+e.summaries.summarised+" / "+e.summaries.prose+"</b>" : "") +
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
    return '<tr><td class="slug" data-label="unit">' + label + '</td><td data-label="queue"><span class="pill">' + esc(u.instance) +
      '</span></td><td data-label="kind">' + kind + '</td><td class="num" data-label="size">' + kb(u.bytes) + '</td><td data-label="state">' +
      (u.ingestedBy ? '<span class="pill ok">ingested → ' + esc(u.ingestedBy) + "</span>"
                    : '<span class="pill warn">uningested</span>') + "</td></tr>";
  }).join("") || '<tr><td colspan="5"><p class="empty">No uploads queue for this subject.</p></td></tr>';
  $("queue").innerHTML = h + "</tbody></table>";
}

function render(){ if (VIEW === "list") renderList(); else renderDesk(); }

/* WHICH ENTRY THIS PAGE IS ABOUT -- read off its own PATH (#1881).

   THREE OUTCOMES, and the middle one is why this is not a one-liner. The
   path names an entry of this page's library and it is selected; the path
   names something the library does not hold, and the page says "not found"
   with a link to the library rather than showing an unfiltered table as if
   it had worked (pb04); or the page is a library page, with no entry, and
   nothing happens.

   A LEGACY #<instance>/<id> link is honoured ONCE and normalised to the path
   IRI: replaceState when the entry is this page's own, a real navigation
   when it belongs to another library page. Nothing emits the fragment form
   any more. Every URL composed here is built from an entry the PROJECTION
   holds, never from the address bar's text. */
function byKey(key){
  return G.entries.filter(function(e){ return e.instance + "/" + e.id === key; })[0];
}
function selectEntry(known){
  if (VIEW !== "list") setView("list");
  $("q").value = known.id;
  renderList();
  var key = known.instance + "/" + known.id;
  var row = document.querySelector('[data-fa-library-item="' + key.replace(/"/g, '\\"') + '"]');
  if (row) {
    row.setAttribute("data-fa-anchored", "1");
    row.scrollIntoView({ block: "center" });
  }
  document.title = (known.title || known.id) + " \u2014 " + known.instance + " library";
  /* The graph of the thing the reader just opened -- bean 7nvr. */
  loadDocument(known.id);
  loadBlocks(known.id, known);
}
function honourAddress(){
  var legacy = legacyKey(location.hash);
  if (legacy) {
    var old = byKey(legacy);
    if (old) {
      var to = entryHref(old);
      if (SCOPE && old.instance === SCOPE) history.replaceState(null, "", to);
      else { location.replace(to); return; }
    }
  }
  var at = entryFromPath(location.pathname, LIB_ROOT);
  if (!at) return;
  var known = at.instance === SCOPE ? byKey(at.instance + "/" + at.id) : undefined;
  if (!known) {
    var lib = LIB_ROOT + encodeURIComponent(SCOPE) + "/";
    $("status").innerHTML = "No entry at this address in the " + esc(SCOPE) + ' library. <a href="' + esc(lib) +
      '">Open the ' + esc(SCOPE) + " library</a>.";
    $("status").setAttribute("data-fa-not-found", "1");
    return;
  }
  selectEntry(known);
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
function renderBlocks(id, data, err, entry){
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
  /* THE DRAIN, for this entry -- counted over the rows below, so the line and
     the table cannot disagree. Advisory: a backlog is work nobody has done
     yet, not a defect. */
  var sums = bs.filter(function(b){ return b.summary; }).map(function(b){ return b.summary.status; });
  var prose = sums.filter(function(x){ return x !== "empty" && x !== "unreadable"; }).length;
  var done = sums.filter(function(x){ return x === "draft" || x === "confirmed"; }).length;
  var drain = prose ? '<p class="note">Agent summaries: <b>' + done + '</b> of ' + prose +
    ' prose block(s) summarised, <b>' + (prose - done) + '</b> still in the queue. ' +
    'Summaries are drafted by an agent a few at a time and confirmed only by a person.</p>' : '';
  el.innerHTML = '<h2>Blocks \u2014 ' + esc(id) + ' <span class="note">(' + bs.length +
    ', in page order)</span></h2>' + withheldBanner(entry, bs) + drain + '<table><thead><tr>' +
    '<th>page</th><th>kind</th><th>types</th><th>title</th><th>narrative / summary</th></tr></thead><tbody>' +
    bs.map(function(b){
      /* BOTH types, never one. A block is dual-typed so a DoCO reader gets
         something without knowing our vocabulary, and showing only ours
         would hide the half this project did not invent. */
      var pages = b.pageStart == null ? '\u2014'
        : (b.pageEnd != null && b.pageEnd !== b.pageStart ? b.pageStart + '\u2013' + b.pageEnd : String(b.pageStart));
      /* A narrative state is three-valued and none of them is an error:
         not-authored means nobody has written one, which is a fact rather
         than a gap. Rendered as plain text for that reason. */
      var nar = b.summary ? summaryBadge(b.summary)
        : b.narrative == null ? '\u2014' : esc(b.narrative);
      /* THE CONTENT IS BEHIND A NATIVE <details> — bean lrmo.
         The owner opened this view and said "i expected to be able to see
         narrative content of extracted node": a row carrying only a state
         says a description exists without saying what it is.

         <details> rather than a scripted panel because it expands, collapses
         and takes focus from the keyboard with no JavaScript at all, which is
         one less thing to get wrong and one less thing to test. gjli.

         TRUNCATION IS DECLARED, never inferred from length. A reader who
         cannot tell a short section from a cut one is being shown a claim the
         data does not support. */
      /* THE CONTENT CELL is blockBody -- summary, withheld line, or the
         neutral "(no content carried)", in that order (issue #1794). Its
         text lives in scripts/lib/library-withheld-view.ts so a test runs
         exactly what this page runs. */
      var body = blockBody(b, entry);
      return '<tr><td class="num">' + esc(pages) + '</td><td>' + esc(b.kind) +
        '</td><td>' + esc((b.types || []).join(' + ')) + '</td><td class="bt">' + body +
        '</td><td>' + nar + '</td></tr>';
    }).join("") + '</tbody></table>';
}
/* A BLOCK SUMMARY'S STATE, in words. Owner, 2026-09-24. Every state is said
   as text rather than colour alone, and none is styled as an error: "not yet
   summarised" is the drain's backlog, which is expected and slow on purpose.
   A draft names its MODEL, because "a model wrote this" without which one is
   the provenance gap schemas/attribution.ts closes. */
function summaryLabel(s){
  var d = s.draftedBy;
  switch (s.status) {
    case "draft":
      return { cls: "info", t: d && d.kind === "agent"
        ? (d.model === "not-disclosed" ? "agent draft (model not disclosed)" : "agent draft (model " + (d.model || "unknown") + ")")
        : "draft by " + (d ? d.id : "unknown") };
    case "confirmed": return { cls: "ok", t: "confirmed by " + (s.confirmedBy || "a person") };
    case "stale": return { cls: "warn", t: "stale: source changed" };
    case "rejected": return { cls: "warn", t: "rejected \u2014 back in the queue" };
    case "empty": return { cls: "", t: "no text to summarise" };
    case "unreadable": return { cls: "warn", t: "text unreadable" };
    default: return { cls: "", t: "not yet summarised" };
  }
}
${WITHHELD_VIEW_JS}
/* The shared edit/feedback recipe (bean v433): the Document panel's [source],
   [feedback] and [edit] links are built by it (bean zcak). */
${EDIT_LINKS_RUNTIME}
${DOCUMENT_VIEW_JS}
function summaryBadge(s){
  var l = summaryLabel(s);
  return '<span class="pill ' + l.cls + '">' + esc(l.t) + '</span>';
}
function summaryPanel(s){
  var why = {
    "not-summarised": "No agent has summarised this block yet. The queue is drained a few blocks at a time.",
    "empty": "The block holds no text, so there is nothing to summarise.",
    "unreadable": "The block names a text file that could not be read."
  }[s.status];
  var who = s.draftedBy
    ? "Drafted by " + s.draftedBy.kind + " " + s.draftedBy.id +
      (s.draftedBy.model === "not-disclosed" ? ", model not disclosed (recoverable from its session)" : s.draftedBy.model ? ", model " + s.draftedBy.model : "") + (s.draftedAt ? ", " + s.draftedAt : "") + ". " +
      (s.status === "confirmed" ? "Confirmed by " + (s.confirmedBy || "a person") + "."
        : s.status === "stale" ? "The block's text has changed since; this summary may no longer match it."
        : s.status === "rejected" ? "Rejected by a person: " + (s.rejectionReason || "no reason recorded") + "."
        : "Not yet confirmed by a person.")
    : "";
  return '<div class="sum">' + summaryBadge(s) +
    (s.text ? '<p>' + esc(s.text) + '</p>' : '<p>' + esc(why || "") + '</p>') +
    (who ? '<p class="note">' + esc(who) + '</p>' : '') + '</div>';
}
function loadBlocks(id, entry){
  fetch(blocksHref(id), {cache: "no-store"})
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){ renderBlocks(id, d, null, entry); })
    .catch(function(e){ renderBlocks(id, null, String(e && e.message || e), entry); });
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
  /* THE SUMMARY DRAIN'S BACKLOG, for the entries this page shows. Advisory,
     like every drain here: styled as a count, never as a failure. Absent
     when the projection carries no count -- nobody counted is not zero. */
  var counted = scoped.filter(function(e){ return e.summaries; });
  if (counted.length) {
    var sb = counted.reduce(function(n,e){ return n + e.summaries.backlog; }, 0);
    var sp = counted.reduce(function(n,e){ return n + e.summaries.prose; }, 0);
    var sd = counted.reduce(function(n,e){ return n + e.summaries.draft; }, 0);
    $("badges").innerHTML += '<span class="badge"><b>' + sb + "</b> of " + sp +
      " prose block(s) not yet summarised" + (sd ? ", <b>" + sd + "</b> agent draft(s) awaiting a person" : "") + "</span>";
  }
  if (G.refScan) {
    var none = scoped.filter(function(e){ return e.refCount === 0; }).length;
    $("badges").innerHTML += '<span class="badge">' +
      (none ? '<b>'+none+"</b> entr(ies) referenced by nothing" : "references scanned") +
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
  honourAddress();
  window.addEventListener("hashchange", honourAddress);
}).catch(function(e){
  $("status").textContent = "could not load the projection: " + e.message;
  $("listing").innerHTML = '<p class="empty">The projection at <code>' + esc(DATA_HREF) + '</code> could not be read. ' +
    "That is not an empty corpus \\u2014 it is a corpus that could not be loaded, and the page says so rather than showing nothing.</p>";
});
`;

/** The entry a shell is about, when it is one — its identity only, never its content. */
export interface ShellEntry {
  id: string;
  /** Href of the entry's published JSON-LD, relative to the page — the `alternate`. */
  jsonld?: string;
}

/** The config block's id — how a library page names itself, and how this generator recognises its own output. */
export const LIBRARY_CONFIG_ID = "fa-library-config";

/**
 * The skeleton {@link VIEWER_JS} fills — the same on the handler's page, an
 * instance's page and every entry page, since the script decides from the
 * config and the page's own path what to draw into it.
 */
const VIEWER_BODY = `<div class="lib-head">
  <h1 id="lib-title">Library — the L1 corpus</h1>
  <p class="empty" id="status" style="padding:0">loading…</p>
  <div class="badges" id="badges"></div>
</div>
<div class="toolbar">
  <input id="q" type="search" placeholder="Search entries…" aria-label="Search entries">
  <span class="seg" role="group" aria-label="View">
    <button type="button" id="vList" aria-pressed="true">Listing</button>
    <button type="button" id="vDesk" aria-pressed="false">Desktop</button>
  </span>
</div>
<div class="lib-main">
  <section id="listing" class="wrap"></section>
  <section id="desktop" hidden></section>
  <section id="document" class="wrap" hidden aria-live="polite"></section>
  <section id="blocks" class="wrap" hidden aria-live="polite"></section>
  <h2>Uploads — the queue feeding this</h2>
  <p class="note">A source sitting here reads as <strong>absent</strong> to every consumer while the file is on disk.
    Queues are counted per declaring instance and never merged.</p>
  <section id="queue" class="wrap"></section>
</div>`;

/** The shared stylesheet and script sit beside the projection. */
const assetsOf = (dataHref: string): string => dataHref.slice(0, dataHref.lastIndexOf("/") + 1);

/** A YAML double-quoted scalar: the two characters it treats specially, escaped. */
function yamlQuoted(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** What one library page is: its title, its identity, and what it says without script. */
interface LibraryPage {
  /** The page title, plain text — the layout's `<title>`. */
  title: string;
  /** The projection's href, relative to the page. The shared assets sit beside it. */
  dataHref: string;
  /** The page's identity, read by {@link VIEWER_JS}. Never an entry's content. */
  config: Record<string, unknown>;
  /** The `<noscript>` content, as HTML; the caller escapes what it interpolates. */
  noscript: string;
  /** The entry's published JSON-LD, relative to the page — its `alternate`. */
  alternate?: string;
  /** Keep the page out of the site search — set on the per-entry pages. */
  searchExclude?: boolean;
}

/**
 * Wrap a library page as a THEMED Jekyll page (2026-10-07).
 *
 * Every page here was a standalone `<!doctype html>` document, so the library
 * was a family on the site without the top band — search, Folio, language —
 * which `docs-ui.js` builds and `_includes/head_custom.html` delivers only to
 * pages on the theme's `default` layout. `gen-auto-docs.ts` `themedPage()` is
 * the precedent and this is its shape: front matter with a quoted title and
 * `nav_exclude`, a generated-by note, then a Liquid-raw body.
 *
 * - **No rail and no folio mount.** The theme's sidebar is the navigation,
 *   and the layout loads `docs-ui.js` and `docs-ui.css` on every page, so the
 *   mount fragment would load them a second time. `check:folio-mount` counts
 *   a page on the layout as mounted for exactly that reason.
 * - **The body is LIQUID-RAW.** Jekyll runs Liquid over a page with front
 *   matter; the body sits between raw and endraw tags, and the one sequence
 *   that could close the raw block early has its percent written as an entity.
 * - **The `alternate` is front matter** (`alternate_jsonld`), because the page
 *   has no head of its own: `head_custom.html` writes the link from it. It is
 *   relative to the page, as it was in the standalone head, and the page's
 *   path is unchanged, so it resolves to the same file.
 * - The shared stylesheet is LINKED from the body (a `stylesheet` link is
 *   allowed there) and scoped to `.lib-page`; `data-fa-no-filter` keeps the
 *   site-wide table filter off tables this viewer already searches.
 */
function libraryPageHtml(p: LibraryPage): string {
  const assets = assetsOf(p.dataHref);
  const config = JSON.stringify(p.config).replace(/</g, "\\u003c");
  const body = `<link rel="stylesheet" href="${escHtml(assets)}viewer.css">
<div class="lib-page" data-fa-no-filter>
${VIEWER_BODY}
</div>
<noscript>${p.noscript}</noscript>
<script type="application/json" id="${LIBRARY_CONFIG_ID}">${config}</script>
<script src="${escHtml(assets)}viewer.js"></script>`.replace(/\{%(-?\s*endraw)/g, "{&#37;$1");
  return `---
layout: default
title: ${yamlQuoted(p.title)}
nav_exclude: true
${p.searchExclude ? "search_exclude: true\n" : ""}${p.alternate !== undefined ? `alternate_jsonld: ${yamlQuoted(p.alternate)}\n` : ""}---
<!--
  GENERATED by cat-harness/scripts/gen-library-viz.ts: the next run of
  bun run library:viz overwrites it, and library:viz:check fails on the
  difference. A hand-edit here is a change nothing else in the tree knows about.
-->
{% raw %}
${body}
{% endraw %}
`;
}

/**
 * A library page that is NOT about one entry — the handler's whole view or an
 * instance's library: a THIN SHELL — owner, 2026-10-02, #1881: *"each
 * link/page needs to be materialized on the CDN (gh-pagees), just load the
 * content from the KG json(ld) assets already published"*.
 *
 * What differs between these pages is the identity in the config block — the
 * projection's href, the scope, the library root. Styles and script are the
 * shared assets {@link VIEWER_CSS} and {@link VIEWER_JS}, found beside the
 * projection. Nothing about any entry's content is written here; the script
 * loads it. A themed page — {@link libraryPageHtml}.
 *
 * @param libRoot  the library root relative to this page: `./` or `../`
 */
export function viewerHtml(dataHref: string, scope = "", libRoot?: string): string {
  return libraryPageHtml({
    title: scope ? `${scope} — library` : "Library — the L1 corpus",
    dataHref,
    config: { data: dataHref, scope, libRoot: libRoot ?? (scope ? "../" : "./") },
    noscript: `<p class="note">This page loads its entries from <a href="${escHtml(dataHref)}">the library projection</a>; it needs JavaScript to draw them.</p>`,
  });
}

/**
 * One ENTRY's page, at `<library>/<instance>/<id>/` (#1881, #1899).
 *
 * The same skeleton ({@link VIEWER_BODY}) the instance page draws into, with
 * the entry's identity in the config; the `<noscript>` names both sources the
 * page loads — the library projection and the entry's JSON-LD — and the
 * JSON-LD is the page's `alternate`. Kept out of the site search: seventy
 * pages with one skeleton would be seventy identical results.
 *
 * @param libRoot  the library root relative to this page: `../../`
 */
export function entryPageHtml(dataHref: string, scope: string, libRoot: string, entry: ShellEntry): string {
  return libraryPageHtml({
    title: `${entry.id} — ${scope} library`,
    dataHref,
    config: { data: dataHref, scope, libRoot, entry: entry.id },
    noscript: `<p class="note">This page loads its entries from <a href="${escHtml(dataHref)}">the library projection</a>${
      entry.jsonld ? ` and this entry from <a href="${escHtml(entry.jsonld)}">its JSON-LD</a>` : ""
    }; it needs JavaScript to draw them.</p>`,
    ...(entry.jsonld ? { alternate: entry.jsonld } : {}),
    searchExclude: true,
  });
}

/**
 * A library page's identity, read from its config block — or `undefined` when
 * it carries none. The page names itself there (#1881), which is what lets a
 * later run prune its own stale output and nothing else.
 */
export function libraryConfigOf(content: string): { data?: unknown; scope?: unknown; libRoot?: unknown; entry?: unknown } | undefined {
  return thinPageConfigOf(content, LIBRARY_CONFIG_ID);
}

/**
 * `orphanSubjectPages`' ownership test for a SUBJECT page: it names the
 * directory it sits in as its scope, and no entry. The library viewer's form of
 * `declaresItsOwnDirectory`, which reads a `var SCOPE` line this page no longer
 * carries now that its script is a shared asset.
 */
export const isSubjectShell = (content: string, name: string): boolean => {
  const c = libraryConfigOf(content);
  return c !== undefined && c.scope === name && c.entry === undefined;
};

/** The same, for an ENTRY page at `<subject>/<name>/`: scope and entry both match. */
export function isEntryShellFor(instance: string): (content: string, name: string) => boolean {
  return (content, name) => {
    const c = libraryConfigOf(content);
    return c !== undefined && c.scope === instance && c.entry === name;
  };
}

/** Every file under `root` (recursively) that is not in `wanted` — absolute paths, sorted. */
export function orphanFiles(root: string, wanted: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const f of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) {
      const abs = join(d, f.name);
      if (f.isDirectory()) walk(abs);
      else if (!wanted.has(abs)) out.push(abs);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Every instance whose declaration publishes a renderable directory at its
 * ROOT route (`instanceRoot: true`), by name → its site-root path `/<name>/`.
 * The route rule is `mount-instance-docs.ts` `withRoutes`: a declared root
 * answers at `/<instance>/`.
 */
export function instanceRootRoutes(repoRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const inst of instanceRootsIn(repoRoot)) {
    let decl;
    try {
      decl = readDeclaration(inst);
    } catch {
      continue; // an unreadable declaration is check:declaration-filename's to report
    }
    const name = decl?.name;
    if (!name) continue;
    const rooted = (decl?.directories ?? []).some((d) => (d as { instanceRoot?: boolean }).instanceRoot === true);
    if (rooted) out.set(name, `/${name}/`);
  }
  return out;
}

/**
 * An entry's `view` — the site-root path of the page that RENDERS it.
 *
 * Owner, 2026-10-02: *"i also expected to be able to click on "smart-trust"
 * slug and open up the visualizer for smart-trust"*. Two cases:
 *
 * - a REFERENCED entry whose record links a `site_path` that is another
 *   instance's DECLARED root route (`instanceRootRoutes`) is rendered there —
 *   smart-trust's IG viewer at `/smart-trust/`. The link chooses the
 *   candidate; the declaration is what makes it a visualiser rather than a
 *   page that merely exists, so a link to anything else is not taken;
 * - every other entry is rendered by this viewer, at its own entry page.
 *
 * Generated into the projection, never stored in the asset.
 */
export function entryView(
  e: { links?: { href: string }[] },
  roots: ReadonlyMap<string, string>,
  entryPage: string,
): string {
  const declared = new Set(roots.values());
  const hit = (e.links ?? []).map((l) => l.href).find((h) => declared.has(h));
  return hit ?? `/${entryPage}/`;
}

let stale = 0;
/**
 * The one writer, for pages and data alike: it writes what it is given.
 *
 * The pages went through a second emitter that injected the harness rail
 * (bean `edx7`) until 2026-10-07. They are THEMED pages now
 * ({@link libraryPageHtml}), and the theme's sidebar is their navigation.
 */
const emit = makeEmit({ check, onStale: () => { stale++; } });

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

/**
 * Avatar copies under `avatarRoot/<instance>/` that no entry names — this
 * generator's own stale output (bean `cw35`). `wanted` holds absolute paths.
 * The directory is written by this generator alone, which is what makes a
 * file in it that nothing names safe to call an orphan.
 */
export function orphanAvatars(avatarRoot: string, wanted: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const inst of existsSync(avatarRoot) ? readdirSync(avatarRoot) : []) {
    const d = join(avatarRoot, inst);
    for (const f of existsSync(d) ? readdirSync(d) : []) {
      const abs = join(d, f);
      if (!wanted.has(abs)) out.push(abs);
    }
  }
  return out.sort();
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
  // directory it names, labelled by that directory's declared graph typology. So
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
        for (const kind of d.graphTypologies ?? []) sources.push({ kind, instance: decl.name ?? basename(inst), dir });
      }
    }
    const scan = scanLibraryRefs(sources, repo);
    for (const e of g.entries) e.referencedBy = scan.bySlug[e.id] ?? [];
    // `scan.filesRead` is NOT carried into the projection — bean `65oe`. It is
    // a count of files on disk, so it differs between CI and a local checkout
    // and made this committed artefact unable to agree with itself. It is
    // reported on the line below instead, where a statistic about a run
    // belongs.
    g.refScan = { unreadable: scan.unreadable };
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
  const libDirs = corpusDirectoriesForGraph(ROOT, "library");
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

  // NO FOLIO MOUNT since 2026-10-07: the pages are on the theme's layout,
  // which loads docs-ui.js and docs-ui.css itself (`libraryPageHtml`).

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
  const byRef = directoryByVisualisationRef(withViewers(readDeclaration(ROOT)?.directories ?? [], ROOT));
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

  // Each entry's blocks are read ONCE, before the index is written, because
  // the index now carries the summary drain's counts (owner, 2026-09-24:
  // "slowly drain") and those are a fact about the blocks. The per-entry
  // files below reuse the same reading, so the count on the index and the
  // rows a reader opens cannot disagree.
  const blocksOf = new Map<string, LibraryBlock[]>();
  for (const e of g.entries) {
    // A withheld entry (bean `cw35`) publishes no verbatim text.
    const blocks = readEntryBlocks(join(repoRoot, e.dir), { verbatim: !e.withheld });
    blocksOf.set(e.id, blocks);
    e.summaries = tally(blocks.flatMap((b) => (b.summary ? [b.summary] : [])));
  }

  // ── EACH ENTRY'S RENDERING, DERIVED (owner, 2026-10-02, #1881) ────────
  //
  // `view` is where the entry is SHOWN — written here, into this generated
  // index, and never into the asset ("asset doesnt know about its
  // renderings"). See `entryView` for the rule.
  const roots = instanceRootRoutes(repoRoot);
  for (const e of g.entries) {
    e.view = entryView(e, roots, relative(site, join(pageDir, e.instance, e.id)).split(sep).join("/"));
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
  // The library's block JSON-LD is not published to the site, so the viewer
  // cannot simply fetch the source; a projection is what it reads. (Each
  // entry's MANIFEST is published since #1881 — see the entry pages below —
  // as the `alternate` of the entry's own IRI, not as the viewer's input.)
  // ── PER-ENTRY DOCUMENT VIEWS (issue #2302, bean `turh`) ──────────────
  //
  // The browsable document — TOC, pages with their printed labels, figures
  // and tables, sections with a summary or an extract, the document checks —
  // read from the INGESTION SCHEMA (`pdf-structure/v1`), so every library
  // entry of every instance gets it. Written for every entry: one with no
  // structure.json gets `{absent: true}`, a determined answer rather than a
  // 404 the viewer would have to tell apart from a failure.
  for (const e of g.entries) {
    // [source] and [feedback] on the document and each section (bean zcak).
    // No [edit]: an entry is frozen, and this instance materialises none.
    const doc = readEntryDocument(join(repoRoot, e.dir), e.id, {
      withheld: !!e.withheld,
      ...(LINK_REPO ? { links: { repo: LINK_REPO, dir: e.dir } } : {}),
    });
    // The entry's resolved title, not the page-1 guess in structure.json
    // (issue #1794: the guess is never a library entry's title).
    if (doc && e.title) doc.title = e.title;
    emit(
      join(dataDir, "entries", `${e.id}.doc.json`),
      JSON.stringify(doc ?? { $schema: "folio-library-document/v1", id: e.id, absent: true }, null, 2) + "\n",
    );
  }

  for (const e of g.entries) {
    const blocks = blocksOf.get(e.id) ?? [];
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
  // AVATAR ORPHANS (bean `cw35`). A copy the graph no longer names stays
  // committed AND published — the 2026-09-24 audit found both refused covers
  // still served from here after their entries were withheld. This directory
  // is written by this generator alone, so a file in it that no entry names
  // is its own stale output: pruned on a write, a finding under `--check`.
  {
    const avatarRoot = join(site, "assets", "library", "avatars");
    const wanted = new Set(g.entries.flatMap((e) => (e.avatar ? [join(site, e.avatar.href.slice(1))] : [])));
    for (const abs of orphanAvatars(avatarRoot, wanted)) {
      if (check) {
        console.error(`  ✗ ${abs} is an orphan avatar — no entry names it`);
        stale++;
        continue;
      }
      rmSync(abs);
      console.log(`  ✗ pruned orphan avatar ${abs}`);
    }
  }
  // Each page says which directories it draws (#1168 B7a-2): the library
  // directories and upload queues whose entries it shows — every one on the
  // whole page, the subject's own on a subject page.
  // A queue carries its instance; a library directory's is its first path
  // segment, since no instance keeps a library at the repository root.
  const drawn = (subject?: string): string[] =>
    [
      ...libDirs.map((d) => renderedPath(repoRoot, d)).map((p) => [p, p.split("/")[0]!] as const),
      ...g.queues.map((q) => [q.dir, q.instance] as const),
    ]
      .filter(([, instance]) => subject === undefined || instance === subject)
      .map(([p]) => p);
  // ── THE SHARED VIEWER ASSETS (#1881) ──────────────────────────────────
  //
  // Published ONCE beside the projection and referenced by every page, so a
  // page is a shell of a few KB rather than ~60 KB of the same CSS and script
  // per URL. Through `emit`, so `--check` compares them like any page.
  emit(join(dataDir, "viewer.css"), VIEWER_CSS);
  emit(join(dataDir, "viewer.js"), VIEWER_JS);

  emit(join(pageDir, "index.html"), withRendersFrontMatter(viewerHtml(dataHref, "", "./"), drawn(), VIEWER_TOOL));
  const wantedJsonld = new Set<string>();
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, seg);
    emit(
      join(sub.pageDir, "index.html"),
      withRendersFrontMatter(viewerHtml(sub.dataHref, subject, "../"), drawn(subject), VIEWER_TOOL),
    );

    // ── EVERY ENTRY'S OWN IRI, MATERIALIZED (owner, 2026-10-02, #1881) ──
    //
    //   > each link/page needs to be materialized on the CDN (gh-pagees),
    //   > just load the content from the KG json(ld) assets already published
    //   > … no query strings... each asset gets its own IRI
    //
    // So `<library>/<instance>/<id>/` is a REAL file — no 404 routing, which
    // the owner ruled "a hack" — and it is the SAME template as the instance
    // page with the entry's identity in its config: nothing of the entry's
    // content is written into it. The script reads the projection and the
    // entry's block file, both already published, and selects the entry from
    // the page's own path.
    //
    // The entry's JSON-LD manifest was NOT published before this (the
    // per-entry note above records it). It is the KG's own serialisation of
    // the entry, so it is copied as-is rather than re-expressed, and each
    // shell names it as its `alternate`.
    const mine = g.entries.filter((e) => e.instance === subject);
    for (const e of mine) {
      const shellDir = join(sub.pageDir, e.id);
      const src = join(repoRoot, e.dir, "manifest.jsonld");
      let jsonld: string | undefined;
      if (existsSync(src)) {
        // At the path its IRI names (`schemas/library-iri.ts`), so the entry's
        // `@id` dereferences to exactly this file — one function decides both.
        const dest = join(site, libraryAssetSitePath(subject, e.id));
        wantedJsonld.add(dest);
        emitBytes(dest, readFileSync(src));
        jsonld = relative(shellDir, dest).split(sep).join("/");
      }
      emit(
        join(shellDir, "index.html"),
        entryPageHtml(`../${sub.dataHref}`, subject, "../../", { id: e.id, ...(jsonld ? { jsonld } : {}) }),
      );
    }

    // A shell whose entry is gone is this generator's own stale output: the
    // subject-page orphan rule (bean `ankg`) one level down, recognised by
    // the shell's own config block rather than by its name.
    const shells = orphanSubjectPages(sub.pageDir, mine.map((e) => e.id), isEntryShellFor(subject));
    for (const name of shells.foreign) {
      console.error(`  ! ${join(sub.pageDir, name)} is not an entry page and does not identify itself — left in place`);
    }
    for (const name of shells.owned) {
      const dir = join(sub.pageDir, name);
      if (check) {
        console.error(`  ✗ ${dir} is an orphan entry page — no ${subject} entry is named ${name}`);
        stale++;
        continue;
      }
      rmSync(dir, { recursive: true });
      console.log(`  ✗ pruned ${dir}`);
    }
  }

  // Published JSON-LD no entry names any more — the avatar rule (bean `cw35`):
  // the directory is this generator's alone, so pruned on a write and a
  // finding under `--check`.
  for (const abs of orphanFiles(join(site, LIBRARY_JSONLD_SITE_DIR), wantedJsonld)) {
    if (check) {
      console.error(`  ✗ ${abs} is an orphan — no entry publishes it`);
      stale++;
      continue;
    }
    rmSync(abs);
    console.log(`  ✗ pruned orphan ${abs}`);
  }


  // ── ORPHANS (bean `ankg`) ──────────────────────────────────────────────
  //
  // A subject page the declaration no longer describes. `emit()` cannot see
  // one — it compares only the files it is about to write — so this is asked
  // separately, and in `--check` an orphan is a FINDING rather than silence.
  const { owned, foreign } = orphanSubjectPages(pageDir, subjects, isSubjectShell);
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
