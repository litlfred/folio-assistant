#!/usr/bin/env bun
/**
 * Render the ingested-IRIS replica pages from the catalogue.
 *
 * @module who-iris/scripts/gen-iris-pages
 *
 * Owner, 2026-09-20: *"<baseurl>/who-iris/communty-list is page"*, a replica of
 * <https://iris.who.int/community-list>, and *"there are not really special
 * visualizers, just webapages that are static rendered."* So: static HTML, no
 * client-side application, generated here and committed.
 *
 * ## Generated from the catalogue, never transcribed
 *
 * Every community, collection, item, byte count and handle on these pages is
 * read out of `who-iris/catalogue/nodes/`. Hand-writing the HTML would have
 * been quicker and would have produced a page that agrees with the KG exactly
 * once — on the day it was written. The screenshots the owner supplied are the
 * LAYOUT reference; the catalogue is the DATA.
 *
 * ## The WHO logo is deliberately absent
 *
 * Owner: *"leeav off WHO logo (as with all who-pages for now, not until
 * published under WHO, just use colors)."* `who_logo.svg` is sitting in the
 * capture and is NOT referenced here. A replica carrying the real mark would
 * be indistinguishable from the real thing at a glance, which is the whole
 * reason the instruction exists — so the wordmark is set in type and the
 * identity is carried by colour alone.
 *
 * ## Nothing is greyed out
 *
 * Owner: *"collectiosn w/ nothing greyed out. only 3 materialized assets in KG
 * so one or two link works."* A disabled-looking row reads as "broken"; a row
 * that says **referenced** reads as "upstream, not here", which is the actual
 * state and the distinction the whole catalogue-by-reference model is for. So
 * every row is live and each one states its own materialisation state.
 *
 * ## Colours come from the `iris-web` theme, which was measured
 *
 * Not eyedroppered off the screenshots. `who-iris/themes/themes.ts` reads them
 * out of the captured `client-theme.css`, and its tests re-read that file, so
 * these pages inherit that provenance instead of starting a second opinion.
 *
 * Usage:
 *   bun run who-iris/scripts/gen-iris-pages.ts
 *   bun run who-iris/scripts/gen-iris-pages.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

import { whoThemeById } from "../themes/themes.js";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");
const NODES = join(INSTANCE, "catalogue", "nodes");
const OUT = join(INSTANCE, "docs");
/**
 * The skill this page is a PROJECTION of — never a second copy of it.
 *
 * Owner, 2026-09-20: *"captiure all your issues in ingesting iris documents in
 * skills"*, then *"that are visible in who-iris/docs"*. Two instructions that
 * pull opposite ways if you obey them separately: a skill an agent reads, and
 * a page a person reads, each free to drift from the other the moment one is
 * edited.
 *
 * So the page is generated FROM the skill. `who-iris/skills/iris-dspace.md` is
 * the single place a finding is written down; the requirements table in it is
 * parsed below and rendered here. Editing the page means editing the skill,
 * and `iris:pages:check` fails if somebody edits the skill and does not
 * re-render — which is the whole mechanism keeping the two honest.
 */
const SKILL = join(INSTANCE, "skills", "iris-dspace.md");

/**
 * The filenames this generator OWNS, and may therefore delete.
 *
 * Deliberately a pattern over its own naming rather than "everything in
 * `docs/`". `deletion-requires-confirmation` is about durable artefacts an
 * agent did not create; this prunes only what this file itself emits, which is
 * the same licence `prunableStickies` operates under. A hand-authored page, an
 * asset directory or a `.nojekyll` in the same directory is untouched.
 */
export const OWNED = /^(index|community-list|ingestion-notes|collection-.*|item-.*)\.html$/;

/**
 * Where a committed file is actually served from.
 *
 * Bean `yl5w`: every `localPath` in the catalogue points at
 * `who-iris/uploads/…`, and all three are MISSING — the bytes are in
 * `cat-harness/uploads/`, because #477 moved `library/` and left `uploads/`
 * behind. The owner asked for *"links to working assets"*, so these pages link
 * to where the bytes ARE and the page says so in the open, rather than
 * emitting a dead link that matches a claim.
 */
const RAW = "https://raw.githubusercontent.com/litlfred/folio-assistant/main";

/**
 * The same bytes, through a CDN.
 *
 * Owner, 2026-09-20: *"there is iris-source, shold also be local repllca page
 * that loads from CDN. both links there -> show power of CDN + KG."*
 *
 * jsDelivr serves any public GitHub repository at
 * `cdn.jsdelivr.net/gh/<owner>/<repo>@<ref>/<path>`, so an item the catalogue
 * knows about is fetchable from an edge cache **without this repository
 * serving anything** — which is the point being demonstrated: the KG says what
 * exists and where, and the bytes come from wherever is nearest.
 *
 * **Pinned to `main` rather than to a tag, deliberately**, because the point
 * is that the catalogue's answer stays current. A tag would demonstrate a
 * frozen copy, which is a different claim.
 *
 * NOT VERIFIABLE FROM THE ENVIRONMENT THAT WRITES THIS. `cdn.jsdelivr.net` is
 * egress-blocked here (CONNECT 403, the same block `r1lz` recorded for
 * `iris.who.int`), so unlike the `raw.githubusercontent.com` links — fetched,
 * 200, byte counts matching the catalogue — these are composed from jsDelivr's
 * documented URL form and cannot be exercised by the generator or its tests.
 *
 * **The owner confirmed one by hand on 2026-09-20** ("cdn link works"), which
 * is the only evidence there is and the only evidence there can be from inside
 * this container. Both forms stay on the page: the CDN one costs this project
 * nothing to serve, and a reader who finds either unavailable still has the
 * other. If the repository is ever made private, the CDN form is the one that
 * breaks first and silently — nothing here will catch that.
 */
const CDN = "https://cdn.jsdelivr.net/gh/litlfred/folio-assistant@main";

/** A repo-relative path, encoded once, for either host. */
function encPath(rel: string): string {
  return rel.split("/").map(encodeURIComponent).join("/");
}

type Node = {
  id: string;
  kind: string;
  flavour: string;
  title: string;
  parents: string[][];
  libraryId?: string;
  metadataRef?: string;
  childCountUpstream?: number;
  materialization?: {
    state: string;
    of?: string;
    note?: string;
    collectionBytes?: number;
  };
  bitstreams?: {
    name: string;
    bundle: string;
    bytes: number;
    mediaType: string;
    materialization?: { state: string; of?: string; localPath?: string };
  }[];
};

/**
 * Every catalogue node, in a DETERMINISTIC order.
 *
 * **The sort is the whole point of this function having a comment.**
 * `readdirSync` returns entries in whatever order the filesystem gives, which
 * is not stable across machines — and several pages below render LISTS of
 * these nodes, so the generated HTML inherited that order. The result was a
 * generator that produced different bytes from identical inputs: green on the
 * machine that wrote the pages, and `iris:pages:check` red in CI with exactly
 * the two list-rendering pages stale (`index.html`, `community-list.html`)
 * while the four per-node pages passed.
 *
 * Sorted on `id`, which every node carries and which is unique — the filename
 * would do today but is derived, and a node renamed on disk should not reorder
 * a page.
 */
function nodes(): Node[] {
  return readdirSync(NODES)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(NODES, f), "utf-8"));
      for (const k of Object.keys(raw)) if (k.startsWith("_")) delete raw[k];
      return raw as Node;
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/** HTML-escape. Every interpolated value goes through it — titles are external data. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Bytes, in the units that round-trip the source.
 *
 * **GiB, not GB, and the difference is not pedantry here.** The IRIS storage
 * report prints "238.58 GB" for Headquarters and the catalogue stores
 * 256,173,324,370 bytes. Divided by 10^9 that renders as *256.17 GB* — a page
 * disagreeing with the note in its own data by 7%. Divided by 2^30 it is
 * 238.58, exactly what the report says. So the report's "GB" is GiB, the
 * catalogue stored it faithfully, and rendering it as GB would have invented a
 * discrepancy. `check-catalogue.ts` already prints GiB for the same reason.
 */
function gb(bytes: number): string {
  return `${(bytes / 2 ** 30).toFixed(2)} GiB`;
}

/** The bytes actually on disk for an item, or undefined when there are none. */
function assetHref(n: Node): { href: string; cdn: string; name: string; bytes: number } | undefined {
  const b = n.bitstreams?.find((x) => x.materialization?.state === "materialized");
  if (!b) return undefined;
  // Resolved against the repository, not against the (broken) declared path —
  // see RAW above and bean yl5w.
  const candidates = [
    join(REPO, "cat-harness", "uploads", b.name),
    join(INSTANCE, "uploads", b.name),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) return undefined;
  const rel = encPath(found.slice(REPO.length + 1));
  return { href: `${RAW}/${rel}`, cdn: `${CDN}/${rel}`, name: b.name, bytes: b.bytes };
}

const THEME = whoThemeById("iris-web")!;

/**
 * The shared chrome.
 *
 * `--iris-*` custom properties, named after the theme's ROLES rather than after
 * the colours, for the reason `schemas/theme.ts` exists: a rule that reads
 * `var(--iris-accent)` still means something when the accent changes.
 */
function page(title: string, crumbs: { label: string; href?: string }[], body: string): string {
  const crumbHtml = crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<span class="here">${esc(c.label)}</span>`
        : `<a href="${esc(c.href ?? "#")}">${esc(c.label)}</a>`,
    )
    .join('<span class="sep">•</span>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ingested IRIS replica</title>
<meta name="description" content="A replica of a WHO IRIS page, rendered from this repository's ingested catalogue. Not WHO, and not live.">
<style>
  :root {
    /* Measured in who-iris/themes/themes.ts from the captured client-theme.css. */
    --iris-accent: ${THEME.palette.accent};
    --iris-ink: ${THEME.palette.ink};
    --iris-edge: ${THEME.palette.edge};
    --iris-surface: ${THEME.palette.surface};
    --iris-dark: #005072;          /* --dark */
    --iris-deep: #2B4E72;          /* --blue */
    --iris-breadcrumb-bg: #e9ecef; /* --ds-breadcrumb-bg */
    --iris-wash: #FAFAFA;          /* --ds-almost-white */
    --iris-current: #d86422;       /* --warning */
    --iris-muted: #6c757d;         /* --gray */
    --iris-ingested: #006666;      /* --info */
    --iris-col: ${(THEME.layouts as { laptop: { minWidth: string } }).laptop.minWidth};
    --iris-pad: ${(THEME.layouts as { laptop: { padding: string } }).laptop.padding};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    /* The stack the captured stylesheet declares, verbatim. */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
    font-size: 1rem; font-weight: 400; line-height: 1.5;
    color: var(--iris-ink); background: var(--iris-surface);
  }
  .wrap { max-width: var(--iris-col); margin: 0 auto; padding: 0 var(--iris-pad); }
  a { color: var(--iris-accent); text-decoration: none; }
  a:hover, a:focus { text-decoration: underline; }

  /* ── The banner. Not decoration: it is requirement 1. ───────────────── */
  .ingested {
    background: var(--iris-ingested); color: #fff;
    padding: 0.7rem var(--iris-pad); font-size: 0.95rem;
  }
  .ingested strong { letter-spacing: 0.02em; }
  .ingested .wrap { padding: 0; }
  .ingested a { color: #fff; text-decoration: underline; }

  /* ── Masthead. NO WHO logo, by instruction — a wordmark in type. ────── */
  header.mast { background: #fff; border-bottom: 1px solid var(--iris-edge); }
  .mast .wrap { display: flex; align-items: center; gap: 1rem; padding-top: 1.1rem; padding-bottom: 1.1rem; }
  .wordmark { display: flex; align-items: baseline; gap: 0.55rem; }
  .wordmark .org {
    font-size: 1.05rem; font-weight: 700; line-height: 1.15;
    color: var(--iris-accent); max-width: 11rem;
  }
  .wordmark .bar { width: 1px; align-self: stretch; background: var(--iris-edge); }
  .wordmark .stack { display: flex; flex-direction: column; }
  .wordmark .iris { font-size: 2.1rem; font-weight: 700; color: var(--iris-accent); letter-spacing: -0.02em; line-height: 1; }
  .wordmark .iris .dot { color: var(--iris-current); }
  .wordmark .sub { font-size: 0.78rem; color: var(--iris-accent); line-height: 1.2; }
  .none { color: var(--iris-muted); font-style: italic; }
  /* The CDN link is secondary to the one that is known to work. */
  .cdn { font-size: 0.88em; color: var(--iris-ingested); }
  .nologo {
    margin-left: auto; font-size: 0.78rem; color: var(--iris-muted);
    text-align: right; max-width: 16rem;
  }

  /* ── Navbar. Solid accent, white links, as the source page. ─────────── */
  nav.main { background: var(--iris-accent); }
  nav.main .wrap { display: flex; flex-wrap: wrap; gap: 1.6rem; padding-top: 0.75rem; padding-bottom: 0.75rem; }
  nav.main a, nav.main span { color: #fff; font-weight: 700; font-size: 0.98rem; }
  nav.main span { opacity: 0.75; font-weight: 400; }

  .crumbs { background: var(--iris-breadcrumb-bg); }
  .crumbs .wrap { padding-top: 0.8rem; padding-bottom: 0.8rem; font-size: 0.98rem; }
  .crumbs .sep { color: var(--iris-muted); margin: 0 0.55rem; }
  .crumbs .here { color: var(--iris-current); }

  main.wrap { padding-top: 2rem; padding-bottom: 3rem; }
  h1 { font-size: 2.6rem; font-weight: 500; line-height: 1.2; margin: 0 0 1.6rem; }
  h2 { font-size: 1.85rem; font-weight: 500; line-height: 1.2; margin: 2.4rem 0 0.9rem; }
  h3 { font-size: 1.15rem; font-weight: 600; margin: 1.6rem 0 0.5rem; }

  ul.communities { list-style: none; margin: 0; padding: 0; }
  ul.communities > li { padding: 0.55rem 0; }
  .row { display: flex; align-items: baseline; gap: 0.7rem; }
  .chev { color: var(--iris-ink); font-size: 1.05rem; line-height: 1; }
  .row .title { font-size: 1.32rem; }
  .note { color: var(--iris-muted); font-size: 0.95rem; margin: 0.2rem 0 0 1.9rem; }
  .kids { margin: 0.35rem 0 0.5rem 1.9rem; padding: 0; list-style: none; }
  .kids li { padding: 0.3rem 0; }

  /* ── Materialisation state. A WORD, never a colour alone (SC 1.4.1). ── */
  .state {
    display: inline-block; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase;
    padding: 0.12rem 0.45rem; border-radius: 3px; border: 1px solid;
    vertical-align: 0.12em;
  }
  .state.materialized { color: #1d5c1d; border-color: #94BA65; background: #f0f6e9; }
  .state.referenced   { color: var(--iris-dark); border-color: var(--iris-edge); background: var(--iris-wash); }
  .state.unknown      { color: #7a4a10; border-color: #ec9433; background: #fdf4e8; }

  table.items { width: 100%; border-collapse: collapse; margin-top: 0.8rem; font-size: 0.97rem; }
  table.items th, table.items td {
    text-align: left; padding: 0.7rem 0.6rem; border-bottom: 1px solid var(--iris-edge);
    vertical-align: top;
  }
  table.items th { font-weight: 700; background: var(--iris-wash); }
  /* Six columns on the held-items table; without a floor the title and
     collection cells wrap to one word per line. */
  table.items td:first-child, table.items th:first-child { min-width: 13rem; }
  table.items td:nth-child(2) { min-width: 9rem; }
  table.items code { font-size: 0.86rem; color: var(--iris-muted); }
  .dl { white-space: nowrap; }

  p.lede { font-size: 1.05rem; line-height: 1.6; max-width: 46rem; }

  table.reqs { width: 100%; border-collapse: collapse; margin-top: 0.9rem; font-size: 0.95rem; }
  table.reqs th, table.reqs td {
    text-align: left; padding: 0.65rem 0.7rem; border-bottom: 1px solid var(--iris-edge);
    vertical-align: top;
  }
  table.reqs thead th { background: var(--iris-wash); font-weight: 700; }
  table.reqs th.rid {
    width: 3.2rem; white-space: nowrap; font-weight: 700; color: var(--iris-accent);
  }
  table.reqs td.why { color: var(--iris-muted); }
  table.reqs code { font-size: 0.87em; }

  .caveat {
    border-left: 4px solid var(--iris-current); background: var(--iris-wash);
    padding: 0.9rem 1.1rem; margin: 1.6rem 0; font-size: 0.95rem;
  }
  .caveat p { margin: 0.4rem 0; }
  .caveat p:first-child { margin-top: 0; }
  .caveat p:last-child { margin-bottom: 0; }

  footer.mast { background: var(--iris-accent); color: #fff; margin-top: 3rem; }
  footer.mast .wrap { padding-top: 1.8rem; padding-bottom: 1.8rem; font-size: 0.93rem; }
  footer.mast a { color: #fff; text-decoration: underline; }
  footer.mast .rule { height: 1px; background: rgba(255,255,255,0.35); margin: 1rem 0; }

  @media (max-width: 640px) {
    h1 { font-size: 1.9rem; }
    /* .none and .cdn are defined above and were duplicated in here; the
       copies said nothing the base rules did not. A .nologo display:none was
       in here too, which HID the "replica, not published under WHO" notice on
       exactly the screens where a reader is least able to tell a replica from
       the real site. It shrinks now; it does not disappear. */
    .nologo { font-size: 0.72rem; max-width: none; }
    .wordmark .iris { font-size: 1.7rem; }
    table.items, table.items tbody, table.items tr, table.items td { display: block; width: 100%; }
    table.items thead { display: none; }
    table.items td { border-bottom: none; padding: 0.25rem 0; }
    table.items tr { border-bottom: 1px solid var(--iris-edge); padding: 0.7rem 0; }
    table.reqs, table.reqs tbody, table.reqs tr, table.reqs td, table.reqs th { display: block; width: auto; }
    table.reqs thead { display: none; }
    table.reqs td, table.reqs th.rid { border-bottom: none; padding: 0.2rem 0; }
    table.reqs tr { border-bottom: 1px solid var(--iris-edge); padding: 0.7rem 0; }
  }
</style>
</head>
<body>

<div class="ingested"><div class="wrap">
  <strong>INGESTED COPY — not WHO, and not live.</strong>
  This page is rendered by <a href="https://github.com/litlfred/folio-assistant">folio-assistant</a>
  from its own catalogue of <a href="https://iris.who.int/">WHO IRIS</a>, modelled
  <em>by reference</em>: 12 nodes of a 361.55&nbsp;GiB repository, of which
  <strong>3 items</strong> are held here. The WHO logo is deliberately omitted.
</div></div>

<header class="mast"><div class="wrap">
  <div class="wordmark">
    <span class="org">World Health<br>Organization</span>
    <span class="bar"></span>
    <span class="stack">
      <span class="iris">iris<span class="dot">.</span></span>
      <span class="sub">Institutional Repository<br>for Information Sharing</span>
    </span>
  </div>
  <div class="nologo">Logo omitted — replica, not published under WHO</div>
</div></header>

<nav class="main"><div class="wrap">
  <a href="community-list.html">Communities &amp; Collections</a>
  <a href="ingestion-notes.html">Ingestion notes</a>
  <span>Browse IRIS</span><span>Statistics</span><span>About</span><span>Contact</span><span>Help</span>
</div></nav>

<div class="crumbs"><div class="wrap">${crumbHtml}</div></div>

<main class="wrap">
${body}
</main>

<footer class="mast"><div class="wrap">
  <p><strong>Ingested replica.</strong> Rendered from
  <code>who-iris/catalogue/</code> by <code>who-iris/scripts/gen-iris-pages.ts</code>.
  Layout after <a href="https://iris.who.int/community-list">iris.who.int</a>; every
  figure on this page is read out of the catalogue, not copied from a screenshot.</p>
  <div class="rule"></div>
  <p>Source of record: <a href="https://iris.who.int/">iris.who.int</a> — © WHO.
  This copy asserts no endorsement and carries no WHO mark.</p>
</div></footer>

</body>
</html>
`;
}

function stateBadge(state: string): string {
  return `<span class="state ${esc(state)}">${esc(state)}</span>`;
}

/** The community list — the page the owner named. */
function communityList(all: Node[]): string {
  const communities = all
    .filter((n) => n.flavour === "community")
    .sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true }));

  const items = all.filter((n) => n.flavour === "item");
  const collections = all.filter((n) => n.flavour === "collection");

  const rows = communities
    .map((c) => {
      const m = c.materialization;
      const kidCollections = collections.filter((k) =>
        k.parents.some((p) => p.includes(c.id)),
      );
      const known =
        c.childCountUpstream !== undefined && m?.collectionBytes !== undefined
          ? `${c.childCountUpstream.toLocaleString("en")} files · ${gb(m.collectionBytes)} upstream`
          : `size upstream <strong>unknown</strong> — the storage report's second page was never read, and a number interpolated from the first would look measured`;

      const kids = kidCollections.length
        ? `<ul class="kids">${kidCollections
            .map((k) => {
              const inIt = items.filter((i) => i.parents.some((p) => p.includes(k.id)));
              const held = inIt.filter((i) => assetHref(i)).length;
              return `<li><a href="collection-${esc(slug(k.id))}.html">${esc(k.title)}</a>
                ${stateBadge(k.materialization?.state ?? "unknown")}
                <span class="note" style="margin:0 0 0 .4rem;display:inline">${inIt.length} item(s) modelled, ${held} held here</span></li>`;
            })
            .join("\n")}</ul>`
        : "";

      return `<li>
  <div class="row"><span class="chev" aria-hidden="true">&rsaquo;</span>
    <span class="title"><a href="${esc(m?.of ?? "https://iris.who.int/")}">${esc(c.title)}</a>
    ${stateBadge(m?.state ?? "unknown")}</span></div>
  <p class="note">${known}</p>
  ${kids}
</li>`;
    })
    .join("\n");

  const held = items.map((i) => ({ n: i, a: assetHref(i) })).filter((x) => x.a);

  const table = held
    .map(
      ({ n, a }) => `<tr>
  <td><a href="item-${esc(slug(n.id))}.html">${esc(n.title)}</a><br>
      <code>${esc(n.libraryId ?? n.id)}</code></td>
  <td>${collectionCell(n, all)}</td>
  <td>${stateBadge("materialized")}</td>
  <td class="dl">${upstreamCell(n)}</td>
  <td class="dl"><a href="${esc(a!.href)}">Download ${esc(a!.name)}</a>
      <br><a class="cdn" href="${esc(a!.cdn)}">via CDN</a>
      <br><code>${(a!.bytes / 1048576).toFixed(2)} MB</code></td>
  <td class="dl">${metadataCell(n)}</td>
</tr>`,
    )
    .join("\n");

  return `<h1>List of Communities</h1>

<p>Every row below is <strong>live</strong>. A row is not greyed out when this
repository does not hold it — it says <span class="state referenced">referenced</span>
instead, which is the actual state and the whole point of a catalogue modelled by
reference. <span class="state materialized">materialized</span> means the bytes are here.</p>

<ul class="communities">
${rows}
</ul>

<h2>Held here — ${held.length} materialized item(s)</h2>
<p>Each row carries <strong>three routes to the same item</strong>: the
<strong>IRIS source</strong> upstream at WHO, this repository's own
<strong>local replica</strong> page, and the <strong>asset itself</strong> —
downloadable from the repository and, separately, from a CDN edge.</p>

<table class="items">
<thead><tr><th>Item</th><th>Collection</th><th>State</th><th>Upstream</th><th>Held copy</th><th>Metadata record</th></tr></thead>
<tbody>
${table}
</tbody>
</table>

<div class="caveat">
  <p><strong>Three routes to one item, which is the point.</strong> The
  catalogue knows this item once; the bytes are reachable <em>upstream at
  WHO</em>, <em>here as a replica page</em>, and <em>from a CDN edge</em> —
  jsDelivr serves any public repository, so the last one costs this project no
  hosting at all. The KG says what exists and where; the CDN says nothing and
  just serves it.</p>
  <p><strong>Both link forms are confirmed working.</strong> The
  <code>raw.githubusercontent.com</code> links were fetched and returned 200
  with byte counts matching the catalogue exactly. The <em>via CDN</em> links
  could not be checked from the environment that generated this page —
  <code>cdn.jsdelivr.net</code> is egress-blocked there — so they were composed
  from jsDelivr's documented URL form and the owner exercised one by hand on
  2026-09-20. Both are kept: one costs this project nothing to serve, and a
  reader who finds either unavailable still has the other.</p>
  <p><strong>Where the held copies actually live — bean <code>yl5w</code>.</strong>
  The catalogue records each of these at <code>uploads/&lt;name&gt;.pdf</code> relative to
  <code>who-iris/</code>, and <em>all three of those paths are missing</em>: #477 moved
  <code>library/</code> into this instance and left <code>uploads/</code> in
  <code>cat-harness/</code>.</p>
  <p>The download links above point at where the bytes <em>are</em>, so they work. The
  claim in the catalogue is what is wrong, and <code>check:catalogue</code> does not
  check <code>localPath</code> at all — it verifies <code>metadataRef</code> and
  <code>libraryId</code>, and reports a clean run over three
  <code>materialized</code> claims that resolve to nothing.</p>
</div>
`;
}

function slug(id: string): string {
  return id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

/**
 * The item's upstream URI, or undefined when it has none.
 *
 * **Undefined is the common case and it must survive to the page.** Two of the
 * three held items carry `of: "local:<slug>"` — they were ingested from a PDF
 * somebody had, not resolved from IRIS — and an earlier version of this
 * function fell back to `https://iris.who.int/`, so every row rendered a
 * confident "IRIS source →" and one third of them went to the front page. A
 * link that resolves is not the same as a link that is true.
 */
function sourceOf(n: Node): string | undefined {
  const b = n.bitstreams?.find((x) => x.materialization?.of?.startsWith("http"));
  if (b?.materialization?.of) return b.materialization.of;
  if (n.materialization?.of?.startsWith("http")) return n.materialization.of;
  return undefined;
}

/**
 * The collection(s) an item is in, as named links — or a statement that the
 * catalogue records none.
 *
 * **Two of the three held items have `parents: []`, and that is real.** They
 * were ingested from a PDF somebody had, not walked down from a collection, so
 * the catalogue knows the bytes and not the shelf. Rendering them under a
 * plausible collection would be inventing containment, which is the same class
 * of error as inventing an upstream URI.
 */
function collectionCell(n: Node, all: Node[]): string {
  const containers = (n.parents[0] ?? [])
    .map((id) => all.find((x) => x.id === id))
    .filter((x): x is Node => x !== undefined);
  const collections = containers.filter((c) => c.flavour === "collection");
  if (collections.length === 0) {
    return `<span class="none">no collection recorded</span>`;
  }
  return collections
    .map(
      (c) =>
        `<a href="collection-${esc(slug(c.id))}.html">${esc(c.title)}</a>` +
        (containers.filter((x) => x.flavour === "community").length
          ? `<br><code>in ${esc(containers.filter((x) => x.flavour === "community").map((x) => x.title).join(" / "))}</code>`
          : ""),
    )
    .join("<br>");
}

/**
 * The Dublin Core record as something a reader can actually download.
 *
 * Owner: *"link to emtada record i can download?"* It was printed as a code
 * path, which tells a reader where it is and makes them go and find it.
 *
 * All three held items DO carry one — checked, not assumed; an earlier note
 * here claimed only one did, from reading a truncated dump. The branch that
 * says "none captured" is still live because `metadataRef` is optional in the
 * schema and an item ingested without a captured DSpace record is the ordinary
 * case upstream; it just is not the case for these three.
 */
function metadataCell(n: Node): string {
  if (!n.metadataRef) return `<span class="none">none captured</span>`;
  const abs = join(INSTANCE, n.metadataRef);
  if (!existsSync(abs)) return `<span class="none">declared, but missing on disk</span>`;
  const rel = encPath(`who-iris/${n.metadataRef}`);
  const bytes = readFileSync(abs, "utf-8").length;
  return `<a href="${esc(`${RAW}/${rel}`)}">Download ${esc(n.metadataRef.split("/").pop()!)}</a>
      <br><a class="cdn" href="${esc(`${CDN}/${rel}`)}">via CDN</a>
      <br><code>qualified Dublin Core · ${(bytes / 1024).toFixed(1)} KB</code>`;
}

/**
 * Where this item can be read FROM — upstream and here, side by side.
 *
 * The owner's *"both links there"*: the IRIS source, and this repository's own
 * replica page for the same item. Putting them in one cell is the whole
 * demonstration — the catalogue knows one item, and it is reachable at WHO and
 * reachable here, with the second not depending on the first being up.
 */
function upstreamCell(n: Node): string {
  const u = sourceOf(n);
  const replica = `<a href="item-${esc(slug(n.id))}.html">Local replica &rarr;</a>`;
  if (u) return `<a href="${esc(u)}">IRIS source &rarr;</a><br>${replica}`;
  const local = n.bitstreams?.find((b) => b.materialization?.of)?.materialization?.of;
  return `<span class="none">no upstream URI recorded</span>${
    local ? `<br><code>${esc(local)}</code>` : ""
  }<br>${replica}`;
}

/** A collection page — the drill-down the owner's second screenshot shows. */
function collectionPage(c: Node, all: Node[]): string {
  const items = all.filter((n) => n.parents.some((p) => p.includes(c.id)));
  const rows = items
    .map((n) => {
      const a = assetHref(n);
      return `<tr>
  <td><a href="item-${esc(slug(n.id))}.html">${esc(n.title)}</a><br><code>${esc(n.libraryId ?? n.id)}</code></td>
  <td>${stateBadge(a ? "materialized" : (n.materialization?.state ?? "unknown"))}</td>
  <td class="dl">${upstreamCell(n)}</td>
  <td class="dl">${a ? `<a href="${esc(a.href)}">Download ${esc(a.name)}</a><br><a class="cdn" href="${esc(a.cdn)}">via CDN</a><br><code>${(a.bytes / 1048576).toFixed(2)} MB</code>` : "not held here"}</td>
  <td class="dl">${metadataCell(n)}</td>
</tr>`;
    })
    .join("\n");

  return `<h1>${esc(c.title)}</h1>
<p>Permanent URI for this collection
  ${c.materialization?.of ? `<a href="${esc(c.materialization.of)}">${esc(c.materialization.of)}</a>` : `<span class="none">none recorded</span>`}
  ${stateBadge(c.materialization?.state ?? "unknown")}</p>

${c.materialization?.note ? `<div class="caveat"><p><strong>How this node was established.</strong> ${esc(c.materialization.note)}</p></div>` : ""}

<h2>Items in this Collection</h2>
<p>Now showing 1 – ${items.length} of ${items.length} <em>modelled</em>. The upstream
collection is larger; this catalogue holds what was materialised, and says so per row.</p>

<table class="items">
<thead><tr><th>Item</th><th>State</th><th>Upstream</th><th>Held copy</th><th>Metadata record</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
`;
}

/** An item page — where both links land on the real thing. */
function itemPage(n: Node, all: Node[]): string {
  const a = assetHref(n);
  const dc = n.metadataRef ? join(INSTANCE, n.metadataRef) : undefined;
  const hasDc = dc !== undefined && existsSync(dc);
  const parents = n.parents[0] ?? [];
  const named = parents
    .map((p) => all.find((x) => x.id === p))
    .filter((x): x is Node => x !== undefined);

  const bits = (n.bitstreams ?? [])
    .map(
      (b) => `<tr>
  <td><code>${esc(b.name)}</code></td>
  <td>${esc(b.bundle)}</td>
  <td>${(b.bytes / 1048576).toFixed(2)} MB</td>
  <td>${stateBadge(b.materialization?.state ?? "unknown")}</td>
</tr>`,
    )
    .join("\n");

  return `<h1>${esc(n.title)}</h1>
<p>Permanent URI for this item
  ${sourceOf(n) ? `<a href="${esc(sourceOf(n)!)}">${esc(sourceOf(n)!)}</a>` : `<span class="none">none recorded — ingested from a local copy, not resolved from IRIS</span>`}
  ${stateBadge(a ? "materialized" : (n.materialization?.state ?? "unknown"))}</p>

${named.length ? `<p class="note" style="margin-left:0">In: ${named.map((p) => esc(p.title)).join(" &rsaquo; ")}</p>` : ""}

<h2>Files</h2>
<table class="items">
<thead><tr><th>Name</th><th>Bundle</th><th>Size</th><th>State</th></tr></thead>
<tbody>
${bits}
</tbody>
</table>

<h3>Both links, as asked for</h3>
<table class="items">
<thead><tr><th>Where</th><th>Link</th></tr></thead>
<tbody>
<tr><td>Upstream, at WHO</td><td>${sourceOf(n) ? `<a href="${esc(sourceOf(n)!)}">${esc(sourceOf(n)!)}</a>` : "none recorded"}</td></tr>
<tr><td>Held here, in folio-assistant</td>
    <td>${a ? `<a href="${esc(a.href)}">${esc(a.name)}</a> &middot; <a class="cdn" href="${esc(a.cdn)}">via CDN</a>` : "not held"}</td></tr>
<tr><td>In collection</td><td>${collectionCell(n, all)}</td></tr>
<tr><td>Ingested text (L1)</td>
    <td>${n.libraryId ? `<a href="https://github.com/litlfred/folio-assistant/tree/main/who-iris/library/${esc(n.libraryId)}/sections">who-iris/library/${esc(n.libraryId)}/sections/</a>` : "—"}</td></tr>
<tr><td>Dublin Core record</td><td>${metadataCell(n)}</td></tr>
</tbody>
</table>

${
  hasDc
    ? ""
    : `<div class="caveat"><p><strong>No Dublin Core record.</strong> The catalogue
  says so rather than synthesising metadata from the PDF — the
  <code>iris-dspace</code> skill's R8, <em>never infer metadata from the PDF when a
  record exists</em>, whose converse is that an absent record stays absent.</p></div>`
}
`;
}

/**
 * The instance's front door — `<base-url>/<kind>/<instance>/`.
 *
 * Owner, 2026-09-20: *"`<baseurl>/who-iris` should be defaul harness
 * behaviour, themed. that default harness benafour shoud show lassets in
 * library"*, and then the addressing rule: *"`<path-to-kind-or-node>`"*, with
 * `library/who-iris` as the worked example.
 *
 * **This is a front door, not the library visualiser.** The library
 * visualiser is bean `jbx2` and belongs to another agent — the owner said so
 * in the same session: *"library is another agent."* So this lists what is
 * held and links onward; it does not try to be the thing somebody else is
 * building, which would be two answers to one question.
 *
 * It exists for a second, mechanical reason: `mount-instance-docs.ts` mounts a
 * directory only when it carries an `index.html` at its root, because "has a
 * front door" is the difference between a built visualiser and a directory of
 * source files served under a URL that promises one.
 */
function landingPage(all: Node[]): string {
  const items = all.filter((n) => n.flavour === "item");
  const held = items.map((n) => ({ n, a: assetHref(n) })).filter((x) => x.a);
  const communities = all.filter((n) => n.flavour === "community");
  const collections = all.filter((n) => n.flavour === "collection");

  const rows = held
    .map(
      ({ n, a }) => `<tr>
  <td><a href="item-${esc(slug(n.id))}.html">${esc(n.title)}</a><br>
      <code>${esc(n.libraryId ?? n.id)}</code></td>
  <td>${collectionCell(n, all)}</td>
  <td class="dl"><a href="${esc(a!.href)}">Download ${esc(a!.name)}</a>
      <br><a class="cdn" href="${esc(a!.cdn)}">via CDN</a>
      <br><code>${(a!.bytes / 1048576).toFixed(2)} MB</code></td>
  <td class="dl">${metadataCell(n)}</td>
</tr>`,
    )
    .join("\n");

  return `<h1>who-iris</h1>

<p>An instance holding a catalogue of <a href="https://iris.who.int/">WHO IRIS</a>
modelled <strong>by reference</strong>. ${all.length} nodes —
${communities.length} communities, ${collections.length} collection,
${items.length} items — of a repository whose own storage report gives
1,057,223 files and 361.55&nbsp;GiB. <strong>${held.length} items are held
here.</strong></p>

<h2>Held assets</h2>
<p>Each carries the asset itself and its qualified Dublin Core record, both
downloadable.</p>

<table class="items">
<thead><tr><th>Item</th><th>Collection</th><th>Asset</th><th>Metadata record</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>

<h2>Browse</h2>
<ul class="kids" style="margin-left:0">
  <li><a href="community-list.html">List of Communities</a> — the replica of
      <code>iris.who.int/community-list</code>, with every node's materialisation state</li>
${collections
  .map((c) => `  <li><a href="collection-${esc(slug(c.id))}.html">${esc(c.title)}</a> — collection</li>`)
  .join("\n")}
</ul>

<div class="caveat">
  <p><strong>This is the front door, not the library visualiser.</strong> The
  full <code>library/</code> visualiser is bean <code>jbx2</code> and is being
  built separately. This page lists what is held and links onward rather than
  becoming a second answer to the same question.</p>
  <p>Addressing follows the owner's rule —
  <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so an instance that
  instantiates a directory gets a visualiser mounted under that directory's
  kind: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, and so on.</p>
</div>
`;
}

/** Where the skill itself is readable, for a reader who wants the full text. */
const SKILL_BLOB = `https://github.com/litlfred/folio-assistant/blob/main/who-iris/skills/iris-dspace.md`;

/**
 * Markdown inline spans → HTML, for text that came out of the skill.
 *
 * Escaped FIRST, then marked up, so a `<` in a requirement stays a `<`. This
 * is not a markdown implementation and does not pretend to be one: it handles
 * the four spans the requirements table actually uses, and anything else
 * passes through as the literal text it is, which is the failure mode you
 * want from a renderer you are trusting with authored content.
 *
 * A RELATIVE link is rewritten onto the GitHub blob. The skill sits at
 * `who-iris/skills/`, these pages at `who-iris/docs/`, and the page is served
 * from two different mount routes — so a relative href that resolves in the
 * repository resolves to nothing on the site. Better a link that leaves for
 * GitHub than one that 404s in place.
 */
function inlineMd(md: string): string {
  let h = esc(md);
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => {
    const abs = /^[a-z]+:|^#/.test(href)
      ? href
      : `${SKILL_BLOB.replace(/\/who-iris\/skills\/iris-dspace\.md$/, "")}/who-iris/skills/${href}`;
    return `<a href="${esc(abs)}">${text}</a>`;
  });
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return h;
}

type Requirement = { id: string; requirement: string; why: string };

/**
 * The requirements, read out of the skill.
 *
 * **Refuses rather than renders an empty table.** A projection that silently
 * produces nothing when its source moves is the `check-catalogue` defect in
 * another costume — an edge to nothing that reads as a relationship. If the
 * table is renamed, restructured or emptied, this throws and the gate goes
 * red, which is a message; a page reading "0 findings" is a lie.
 */
export function requirementsFromSkill(md: string): Requirement[] {
  const out: Requirement[] = [];
  for (const line of md.split("\n")) {
    const m = /^\|\s*\*\*(R\d+)\*\*\s*\|(.+?)\|(.+?)\|\s*$/.exec(line);
    if (m) out.push({ id: m[1]!, requirement: m[2]!.trim(), why: m[3]!.trim() });
  }
  if (out.length === 0) {
    throw new Error(
      "who-iris/skills/iris-dspace.md: no `| **Rn** | … | … |` rows found. " +
        "The ingestion-notes page is a projection of that table — if the table " +
        "moved, move this parser with it rather than shipping an empty page.",
    );
  }
  return out;
}

/**
 * What ingesting the IRIS documents actually cost, as a page.
 *
 * Every row here was paid for in this repository: a guessed parent, an
 * invented UUID, a GB that was a GiB, three `materialized` claims resolving to
 * no bytes. They are written down in the skill so the next AGENT is stopped by
 * them, and rendered here so a PERSON can see what the ingestion is standing
 * on without reading a skill file.
 */
function ingestionNotes(reqs: Requirement[], all: Node[]): string {
  const items = all.filter((n) => n.flavour === "item");
  const held = items.filter((n) => assetHref(n) !== undefined).length;

  const rows = reqs
    .map(
      (r) =>
        `<tr><th class="rid">${esc(r.id)}</th><td>${inlineMd(r.requirement)}</td>` +
        `<td class="why">${inlineMd(r.why)}</td></tr>`,
    )
    .join("\n");

  return `
<h1>What ingesting these documents cost</h1>

<p class="lede">Every rule below was learned by getting it wrong here first. They live in
<code>who-iris/skills/iris-dspace.md</code> — <a href="${SKILL_BLOB}">read the skill</a> —
and this page is generated from that file, so the two cannot drift. There are
<strong>${reqs.length}</strong> of them, against <strong>${items.length}</strong> item(s) in the
catalogue, <strong>${held}</strong> of which this repository actually holds the bytes for.</p>

<div class="caveat">
  <p><strong>Why a page and not just a skill.</strong> A skill is read by an agent about
  to act. A reader deciding whether to <em>trust</em> what was ingested needs the same
  facts and will not open a skill file to get them. Same text, two audiences, one
  source — the skill.</p>
</div>

<h2>Requirements a record can be checked against</h2>
<table class="reqs">
  <thead><tr><th>#</th><th>Requirement</th><th>Why, in one line</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>

<h2>Still open</h2>
<p>Bean <code>yl5w</code>: every <code>localPath</code> in the catalogue points at
<code>who-iris/uploads/</code> and all three are missing — the bytes are under
<code>cat-harness/uploads/</code>, and <code>check:catalogue</code> does not check
<code>localPath</code> at all. These pages link to where the bytes <em>are</em> rather
than to where the claim says they are, and say so rather than emitting a dead link
that matches the claim. That is a workaround, not a fix.</p>

<p><code>iris.who.int</code> is egress-blocked from the environment that generates this
page, so nothing here was fetched from IRIS. Every record was transcribed from a capture
the owner supplied. Where a transcription is partial, the record says so.</p>
`;
}

function main(): number {
  const all = nodes();
  const files = new Map<string, string>();

  files.set(
    "index.html",
    page("who-iris", [{ label: "Home" }], landingPage(all)),
  );

  files.set(
    "ingestion-notes.html",
    page(
      "What ingesting these documents cost",
      [{ label: "Home", href: "index.html" }, { label: "Ingestion notes" }],
      ingestionNotes(requirementsFromSkill(readFileSync(SKILL, "utf-8")), all),
    ),
  );

  files.set(
    "community-list.html",
    page("List of Communities", [{ label: "Home", href: "community-list.html" }, { label: "Community List" }], communityList(all)),
  );

  for (const c of all.filter((n) => n.flavour === "collection")) {
    files.set(
      `collection-${slug(c.id)}.html`,
      page(c.title, [{ label: "Home", href: "community-list.html" }, { label: c.title }], collectionPage(c, all)),
    );
  }

  for (const n of all.filter((x) => x.flavour === "item")) {
    files.set(
      `item-${slug(n.id)}.html`,
      page(n.title, [{ label: "Home", href: "community-list.html" }, { label: n.title }], itemPage(n, all)),
    );
  }

  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [name, html] of files) {
    const p = join(OUT, name);
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : undefined;
    if (prev === html) continue;
    if (check) {
      console.error(`stale or missing: who-iris/docs/${name}`);
      stale++;
      continue;
    }
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, html);
  }

  // ── ORPHANS ────────────────────────────────────────────────────────────
  //
  // **This generator wrote and never deleted, and that is a defect rather
  // than a gap.** Re-keying two items from `item/local:<slug>` to their real
  // DSpace UUIDs (2026-09-20) left `item-item-local-*.html` behind: nine files
  // where seven were wanted, two of them serving the OLD record at a URL
  // nothing links to any more. `--check` was blind to it, because it only ever
  // inspected the files it was about to write — so it reported "up to date"
  // over content the catalogue no longer describes.
  //
  // That is the `yl5w` shape pointed the other way. There, a claim resolved to
  // no file; here, a file answers to no claim.
  //
  // Pruning is scoped to THIS GENERATOR'S OWN NAMING, never to the directory:
  // a page somebody hand-added, a `.nojekyll`, an asset directory, all survive.
  // Precedent is `prunableStickies` in `ensure-landing-sticky.ts`, which prunes
  // its own output for the same reason.
  const orphans = existsSync(OUT)
    ? readdirSync(OUT)
        .filter((f) => OWNED.test(f) && !files.has(f))
        .sort()
    : [];

  if (check) {
    for (const o of orphans) console.error(`orphaned: who-iris/docs/${o}`);
    if (stale || orphans.length) {
      const bits = [
        stale ? `${stale} page(s) stale` : "",
        orphans.length ? `${orphans.length} orphaned` : "",
      ].filter(Boolean).join(", ");
      console.error(`\n${bits}. Run: bun run who-iris/scripts/gen-iris-pages.ts`);
      return 1;
    }
    console.log(`gen-iris-pages --check: ${files.size} page(s) up to date, no orphans.`);
    return 0;
  }

  for (const o of orphans) rmSync(join(OUT, o));

  console.log(`wrote ${files.size} page(s) to who-iris/docs/`);
  for (const name of files.keys()) console.log(`  ${name}`);
  for (const o of orphans) console.log(`  pruned ${o}`);
  return 0;
}

if (import.meta.main) process.exit(main());
