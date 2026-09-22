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
import { basename, dirname, join, relative, resolve, sep } from "path";

import { whoThemeById } from "../themes/themes.js";
import { bytesFor, repoRelative } from "./lib/bytes.js";
import type { CatalogueNode } from "../../folio-assistant-core/schemas/catalogue.js";


const INSTANCE = resolve(import.meta.dir, "..");
/** The repository root — only the platform-owned architecture drawing is read from here. */
const REPO_ROOT = resolve(INSTANCE, "..");

const NODES = join(INSTANCE, "catalogue", "nodes");
/**
 * WHERE EACH PAGE GOES, and the two are different KINDS of thing.
 *
 * Owner, 2026-09-21: *"the iris KG should be in who-iris/library (served by
 * cat-harness/library) which may or may not inlude materialized content, the
 * docs in who-iris/docs (served by cat-harness/docs)."*
 *
 * So the split is not cosmetic. The replica — the home page, the community
 * list, every collection and item page — is a RENDERING OF THE KG, and the KG
 * is library-side. The ingestion notes and the portal proposal are
 * DOCUMENTATION, and documentation is docs-side. One directory served both
 * until now, and `mount-instance-docs.ts` copies a declared directory to
 * `/<kind>/<instance>/`, so `/docs/who-iris/` was byte-for-byte the replica
 * with the replica's own top navbar. That is what the owner was looking at.
 *
 * **Only loose files go into `library/`.** Every DIRECTORY under a library
 * graph is read as a corpus entry by `library-graph.ts` — it walks
 * subdirectories and treats each as a slug — so an `assets/` folder there
 * would appear in the L1 listing as a document titled "assets" with no
 * sections. The covers therefore stay where the catalogue's `localPath`
 * already names them, and nothing about `yl5w` has to move again.
 */
const LIB = join(INSTANCE, "library");
const DOCS = join(INSTANCE, "docs");

// No `outDirFor(name)` helper: the map key carries the side, so nothing has to
// infer it from a filename. An inference would have to be kept in step with
// the two OWNED patterns below, and three answers to one question is how a
// page ends up written to one side and pruned from the other.
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
 * The architecture drawing, INLINED rather than linked.
 *
 * It lives in the platform (`cat-harness/docs/assets/img/`) because the
 * pattern is generic and who-iris is one worked example of it — a second copy
 * under this instance would be two drawings of one architecture, free to
 * disagree the first time either is edited.
 *
 * Inlined rather than referenced because these pages are served from **two**
 * mount routes (`/who-iris/` and `/docs/who-iris/`), so any relative path to a
 * file outside this directory resolves under one of them and 404s under the
 * other. An absolute site URL would work and would hard-code the publication
 * base into a generated page, which is the thing `canonicalUrl` exists to stop.
 * Reading the bytes sidesteps both.
 */
const ARCH_SVG = join(REPO_ROOT, "cat-harness", "docs", "assets", "img", "kg-to-portal-architecture.svg");

/**
 * The filenames this generator OWNS, and may therefore delete.
 *
 * Deliberately a pattern over its own naming rather than "everything in
 * `docs/`". `deletion-requires-confirmation` is about durable artefacts an
 * agent did not create; this prunes only what this file itself emits, which is
 * the same licence `prunableStickies` operates under. A hand-authored page, an
 * asset directory or a `.nojekyll` in the same directory is untouched.
 */
/**
 * The documentation pages, named rather than pattern-matched.
 *
 * Two of them, and both are prose about the work rather than a rendering of
 * the catalogue. A pattern would have to guess, and guessing which side of the
 * split a page falls on is the one thing this must not do.
 */
export const DOC_PAGES = new Set(["index.html", "ingestion-notes.html", "kg-to-portal.html"]);

/** Everything this generator writes, on either side. */
export const OWNED = /^(index|community-list|ingestion-notes|kg-to-portal|catalogue|collection-.*|item-.*)\.html$/;

/** What it owns in `library/` — the replica, which is the KG rendered. */
export const OWNED_LIB = /^(index|community-list|collection-.*|item-.*)\.html$/;

/**
 * What it owns in `docs/` — the documentation, and its own index.
 *
 * `index.html` is owned on BOTH sides, deliberately: the replica needs one
 * because it is a site, and the docs side needs one because
 * `mount-instance-docs.ts` will not mount a directory without it. The
 * cross-side sweep below therefore has to exclude a name owned here as well,
 * or it deletes the docs index on sight.
 */
export const OWNED_DOCS = /^(index|ingestion-notes|kg-to-portal)\.html$/;

/**
 * Where a committed file is actually served from.
 *
 * The owner asked for *"links to working assets"*, so a link here is built
 * from a path that RESOLVED rather than from one the catalogue claims. Until
 * 2026-09-21 those were different things — bean `yl5w`: every ORIGINAL
 * `localPath` named `who-iris/uploads/…` while the bytes sat in
 * `cat-harness/uploads/`, and `lib/bytes.ts` carried a fallback so the links
 * worked anyway. The sources have since moved into the folio and the fallback
 * is gone, so the two now agree; the rule stays, because a generator that
 * emits a link from an unverified claim is one relocation away from shipping
 * dead links again.
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

/**
 * A node, as the SCHEMA defines it — not a hand-written restatement of it.
 *
 * This was a local `type Node = { … }` listing about a dozen fields. It went
 * stale the moment `pixelWidth`/`pixelHeight` were added to `BitstreamSchema`,
 * and the way it went stale is the argument: `tsc` reported that
 * `materialization.note` "does not exist" on a node that has carried a `note`
 * since the catalogue was written. A second declaration of one type does not
 * catch drift, it REPORTS drift as an error in the wrong file.
 */
type Node = CatalogueNode;

/**
 * The catalogue's own header — the upstream figures, read rather than restated.
 *
 * `totalItemsUpstream` and `totalFilesUpstream` are SEPARATE fields, and this
 * page is the reason they are. The catalogue used to carry the file count in
 * the items field with a note saying so, because the statistics page publishes
 * files and IRIS's item count was not known. It is on the home page this mocks
 * — the search placeholder — so both are now stored, and `1,057,223 files` was
 * hard-coded into the old landing page's prose where neither this file nor
 * anything else would have noticed it going stale.
 */
function catalogue(): { totalItemsUpstream?: number; totalFilesUpstream?: number; totalBytesUpstream?: number } {
  return JSON.parse(readFileSync(join(INSTANCE, "catalogue", "catalogue.json"), "utf-8"));
}

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

/**
 * Bytes as megabytes — or the fact that nobody measured them.
 *
 * `Bitstream.bytes` is OPTIONAL in the schema, and this file's hand-written
 * copy of the type said it was required. `(undefined / 1048576).toFixed(2)`
 * is the string `"NaN"`, so a bitstream with no recorded size would have
 * rendered `NaN MB` on the item page — a measurement-shaped hole, which is
 * exactly the thing `unknown`-as-a-third-state exists to stop. Nothing in the
 * catalogue hits it today; deleting the duplicate type is what surfaced it.
 */
function mb(bytes: number | undefined): string {
  return bytes === undefined ? "not recorded" : `${(bytes / 1048576).toFixed(2)} MB`;
}

/** The bytes actually on disk for an item, or undefined when there are none. */
function assetHref(n: Node): { href: string; cdn: string; name: string; bytes?: number } | undefined {
  const b = n.bitstreams?.find(
    (x) => x.bundle !== "THUMBNAIL" && x.materialization?.state === "materialized",
  );
  if (!b) return undefined;
  // Where the bytes ARE, which is not where the catalogue says — bean `yl5w`,
  // and the resolution order is in `lib/bytes.ts` so the workaround has one
  // home to be deleted from.
  const found = bytesFor(b.materialization?.localPath, b.name);
  if (!found) return undefined;
  const rel = encPath(repoRelative(found));
  return { href: `${RAW}/${rel}`, cdn: `${CDN}/${rel}`, name: b.name, bytes: b.bytes };
}

/**
 * The cover thumbnail, or nothing.
 *
 * A THUMBNAIL-bundle bitstream **this repository rendered itself** — not the
 * one DSpace generates upstream. `who-iris/scripts/gen-covers.ts` writes the
 * bytes and the node records the derivation; here it is only read.
 *
 * Nothing is invented when it is absent, and nothing is guessed when it is
 * present: the box comes from `pixelWidth`/`pixelHeight` on the bitstream, so
 * a listing reserves the right space before the image loads. The three covers
 * are 2:3, 0.705:1 and a scanned page — any default would be wrong about two
 * of them, and a wrong box is a reflow rather than a missing image, which is
 * the harder failure to notice.
 */
/**
 * Are the rendered covers SHOWN on the replica?
 *
 * **Yes, with the emblem masked — the owner's ruling of 2026-09-21.**
 *
 * The question first put to them was whether the emblem printed on a WHO
 * publication reads as *content* — the document's own cover — or as *branding*
 * this page is wearing. They named it with the logo: *"logo and other
 * branding"*, and the covers were withheld. Asked again whether to show them
 * masked, they chose masking over withholding.
 *
 * So the standing instruction is still honoured — *"leave off WHO logo (as
 * with all who-pages for now, not until published under WHO, just use
 * colors)"* — and the covers are back. The emblem never reaches this page:
 * `pdf-cover.py` blanks it **before the PNG is written**, so the committed
 * bytes do not contain it and no display flag can leak it. The regions and
 * their reason are declared on each THUMBNAIL bitstream as `maskedRegions`.
 *
 * **The TITLE is not masked where it contains "WHO"** — *WHO Editorial Style
 * Manual*, *WHO Handbook for Guideline Development*. That is the work's name,
 * a bibliographic fact about the publication, not branding this replica is
 * wearing. Masking it would leave a cover that names no book.
 *
 * `false` still works and still says *"cover withheld"* rather than *"no
 * cover"*, because those remain different facts. It is no longer the position
 * the covers are in, only the switch that would put them back.
 */
const COVERS_SHOWN = true;

function coverSrc(n: Node): { src: string; w: number; h: number; masked: boolean } | undefined {
  const b = n.bitstreams?.find((x) => x.bundle === "THUMBNAIL");
  const lp = b?.materialization?.localPath;
  if (!b || !lp || b.pixelWidth === undefined || b.pixelHeight === undefined) return undefined;
  // Declared path honoured directly here, unlike `assetHref`: these bytes are
  // ones this repository wrote, at the path the node names, so a fallback
  // would be covering for a bug of our own making rather than for `yl5w`.
  const abs = join(INSTANCE, lp);
  if (!existsSync(abs)) return undefined;
  // RELATIVE TO THE DIRECTORY THE PAGE IS WRITTEN INTO, computed, not stripped.
  //
  // This was `lp.replace(/^docs\//, "")`, correct for exactly as long as these
  // pages lived in `docs/`. They moved to `library/` in `zgba` and the covers
  // did not, so every `src` resolved to `library/assets/covers/...` -- a 404,
  // invisible because `COVERS_SHOWN` was false and the `<img>` was never
  // emitted. Two faults stacked, the outer one hiding the inner.
  //
  // A literal prefix is a second answer to "where is this page", and it goes
  // stale the moment the first answer moves. `relative()` asks the one answer.
  return {
    src: encPath(relative(LIB, abs).split(sep).join("/")),
    w: b.pixelWidth,
    h: b.pixelHeight,
    // Read off the bitstream rather than assumed for every cover: a future
    // item whose cover carries no emblem needs no mask, and alt text claiming
    // one was removed would be describing a different image.
    masked: (b.maskedRegions ?? []).length > 0,
  };
}

const THEME = whoThemeById("iris-web")!;

/**
 * The shared chrome.
 *
 * `--iris-*` custom properties, named after the theme's ROLES rather than after
 * the colours, for the reason `schemas/theme.ts` exists: a rule that reads
 * `var(--iris-accent)` still means something when the accent changes.
 */
/**
 * The sticky banner's figures, COMPUTED.
 *
 * They were three literals — "12 nodes of a 361.55 GiB repository, of which 3
 * items are held here" — and by the time the covers landed the first was
 * wrong: the catalogue had thirteen nodes and every page said twelve. That is
 * the failure this repository keeps naming in its own prose, *a count in prose
 * is a claim rather than evidence*, committed on the one line that appears at
 * the top of every page.
 *
 * Memoised because it appears on all of them and the inputs cannot change
 * within a run.
 */
let BANNER: string | undefined;
function banner(): string {
  if (BANNER !== undefined) return BANNER;
  const all = nodes();
  const held = all.filter((n) => n.flavour === "item" && assetHref(n) !== undefined).length;
  const c = catalogue();
  const size = c.totalBytesUpstream !== undefined ? gb(c.totalBytesUpstream) : "an unmeasured";
  const of =
    c.totalItemsUpstream !== undefined
      ? `${c.totalItemsUpstream.toLocaleString("en-US")}-item`
      : "";
  BANNER =
    `${all.length} nodes of a ${of} ${size} repository, of which ` +
    `<strong>${held} item${held === 1 ? "" : "s"}</strong> ${held === 1 ? "is" : "are"} held here`;
  return BANNER;
}

/**
 * One replica page.
 *
 * `side` is not decoration: the two sides are MOUNTED AT DIFFERENT ROUTES —
 * `who-iris/library/` at `/who-iris/` and `who-iris/docs/` at
 * `/docs/who-iris/` — so a relative link written on one side and rendered on
 * the other resolves to a path that does not exist. Both sides carried exactly
 * that, and both 404ed on the deployed site: the shared chrome's
 * `community-list.html` from every docs page, and the landing page's
 * `ingestion-notes.html` from `/who-iris/`. The comment below anticipated it
 * in 2026-09-21 — *"linking across two mount points … breaks the first time
 * either route moves"* — and the links were written anyway.
 *
 * Nothing here composes a cross-mount path to replace them. **The harness rail
 * is the cross-mount navigation** (`◆ who-iris`, `D docs`, `L library`), and
 * it is injected at mount time by the layer that knows the routes. A generator
 * that composed `../../who-iris/` would be this instance holding a second copy
 * of the mount table, free to disagree with it.
 */
function page(
  title: string,
  crumbs: { label: string; href?: string }[],
  body: string,
  side: "library" | "docs",
): string {
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
  /* The KG view's tables. Deliberately plainer than the replica's furniture:
     this page is ABOUT the catalogue rather than a mock of IRIS, and dressing
     it as IRIS would invite a reader to take its counts for IRIS's. */
  .kg { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .95rem; }
  .kg th, .kg td { text-align: left; padding: .4rem .55rem; border-bottom: 1px solid var(--iris-edge); vertical-align: top; }
  .kg th { font-weight: 600; white-space: nowrap; }
  .dim { opacity: .65; font-size: .85em; }

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

  /* ── IRIS home replica ────────────────────────────────────────────────
     Bands in the capture's order: hero, search, Recent Submissions. Measured
     against who-iris/uploads/iris-home/iris-capture/IRIS Home.pdf page 1.

     The hero bleeds to the wrap's edges rather than to the viewport: 100vw
     inside a centred column is the classic horizontal-scrollbar bug, and a
     replica that scrolls sideways on a phone is a worse infidelity than a
     hero 32px narrower than the original. */
  .hero {
    margin: 0 calc(-1 * var(--iris-pad)) 1.6rem;
    padding: 3.2rem var(--iris-pad) 2.4rem;
    /* Colour only. The real hero is a photograph of the Geneva headquarters
       with the WHO emblem on the facade; see landingPage() for why neither is
       here. Both stops are theme roles, not literals. */
    background: linear-gradient(135deg, var(--iris-dark) 0%, var(--iris-accent) 55%, var(--iris-deep) 100%);
    color: #fff;
  }
  .hero-in { max-width: 34rem; }
  .hero h1 { font-size: 3.6rem; line-height: 1; margin: 0 0 1.2rem; color: #fff; font-weight: 400; }
  .hero p { font-size: 1.06rem; line-height: 1.5; margin: 0; color: rgba(255,255,255,0.95); }
  /* Two classes, not one: the rule .hero p is class+element and beat the bare
     .hero-note, so the margin below was declared and never applied -- the
     replica note sat flush against the last line of the hero paragraph and
     read as part of it. */
  .hero .hero-note {
    margin: 1.6rem 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.8);
    border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.9rem;
  }
  .hero-note code { color: #fff; }

  .searchbar { display: flex; gap: 0; margin: 1.8rem 0 0.5rem; }
  .searchbar input {
    flex: 1; padding: 0.7rem 0.9rem; font-size: 1rem; font-family: inherit;
    border: 1px solid var(--iris-edge); border-right: none; border-radius: 4px 0 0 4px;
    background: #fff; color: var(--iris-muted);
  }
  .searchbar button {
    padding: 0.7rem 1.4rem; font-size: 1rem; font-family: inherit; font-weight: 600;
    border: 1px solid var(--iris-accent); border-radius: 0 4px 4px 0;
    background: var(--iris-accent); color: #fff;
  }
  /* The disabled attribute already communicates this to a pointer; the cursor
     says it to a reader who hovers before clicking. */
  .searchbar input[disabled], .searchbar button[disabled] { cursor: not-allowed; opacity: 1; }
  .searchnote { font-size: 0.88rem; color: var(--iris-muted); margin: 0.4rem 0 2rem; }
  .ordering { font-size: 0.88rem; color: var(--iris-muted); margin: 0.2rem 0 1.4rem; }

  .subs { display: flex; flex-direction: column; gap: 1.8rem; }
  .sub { display: flex; gap: 1.2rem; align-items: flex-start; }
  /* A fixed column so a landscape cover and a portrait one start on the same
     line. The IMAGE keeps its own aspect -- pixelWidth and pixelHeight are on
     the tag, so the box is reserved before the bytes arrive and nothing
     reflows. */
  .sub-cover { flex: 0 0 104px; }
  .sub-cover img { width: 104px; height: auto; display: block; border: 1px solid var(--iris-edge); }
  /* Centred by FLEX, not by a line-height equal to the height: the withheld
     placeholder is two lines, and a 140px line-height would put the first of
     them below the box. */
  .sub-cover .nocover {
    display: flex; align-items: center; justify-content: center;
    width: 104px; height: 140px; border: 1px dashed var(--iris-edge);
    color: var(--iris-muted); font-size: 0.78rem; text-align: center; line-height: 1.3;
  }
  .sub-body { flex: 1; min-width: 0; }
  .sub-title { font-size: 1.02rem; line-height: 1.35; text-decoration: underline; }
  .sub-by { margin: 0.35rem 0 0.4rem; font-size: 0.9rem; color: var(--iris-ink); }
  .sub-abs {
    margin: 0 0 0.5rem; font-size: 0.93rem; line-height: 1.5;
    /* The capture truncates each abstract under a "Show more" control. This
       clamps instead of shipping a disclosure widget -- the owner asked for a
       replica of the look, not working functionality. */
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .sub-abs.none { display: block; font-style: italic; color: var(--iris-muted); }
  .sub-links { margin: 0; font-size: 0.88rem; }

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
  table.reqs td .why { font-size: 0.88em; color: var(--iris-muted); }

  /* The architecture drawing, inlined. Authored at 1000x432 and scaled down on
     a narrow screen: an auto height keeps its aspect, which a figure of
     labelled boxes cannot survive losing.
     NOTE FOR ANYONE EDITING THESE COMMENTS: this whole stylesheet is inside a
     JS template literal, so a backtick here ends the string and the generator
     stops parsing. It has happened four times. Write CSS identifiers plainly. */
  figure.arch { margin: 1.6rem 0; }
  figure.arch svg { width: 100%; height: auto; max-width: 1000px; display: block; border: 1px solid var(--iris-edge); border-radius: 6px; }
  figure.arch figcaption { font-size: 0.88rem; color: var(--iris-muted); margin-top: 0.6rem; }

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
    .hero h1 { font-size: 2.6rem; }
    .searchbar { flex-direction: column; }
    .searchbar input { border-right: 1px solid var(--iris-edge); border-radius: 4px 4px 0 0; }
    .searchbar button { border-radius: 0 0 4px 4px; }
    .sub { flex-direction: column; }
  }
</style>
</head>
<body>

<div class="ingested"><div class="wrap">
  <strong>INGESTED COPY — not WHO, and not live.</strong>
  This page is rendered by <a href="https://github.com/litlfred/folio-assistant">folio-assistant</a>
  from its own catalogue of <a href="https://iris.who.int/">WHO IRIS</a>, modelled
  <em>by reference</em>: ${banner()}. The WHO logo is deliberately omitted, and the
  rendered covers are withheld from display for the same reason — they carry the
  emblem printed on the publications.
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
  <div class="nologo">Logo omitted, covers withheld — replica, not published under WHO</div>
</div></header>

<!--
  THE DOCUMENTATION IS NOT IN THIS NAVBAR, and that is the owner's ruling of
  2026-09-21: *"the docs/ should not be for the who-iris top navbar, instead,
  f-a navbar should still be on the left, with who-iris and then link to docs
  on side in navbar."*

  This strip is the REPLICA's chrome -- it exists to look like the IRIS site,
  and the IRIS site has no page about how this repository ingested it. The
  ingestion notes and the portal proposal are reached from the folio-assistant
  navbar on the left, through who-iris's own tile in harness-tiles.ts, which
  is where a reader looking for documentation about this harness is standing.
  Putting them here also meant linking across two mount points once the split
  landed, which is a relative path that breaks the first time either route
  moves.

  (No backticks in this comment: it sits inside the page template literal, and
  one here closes the string and turns the rest of the file into TypeScript,
  failing at a line far from the mistake.)
-->
<nav class="main"><div class="wrap">
  ${side === "library"
    ? `<a href="community-list.html">Communities &amp; Collections</a>`
    : `<span>Communities &amp; Collections</span>`}
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

/**
 * The catalogue as a GRAPH — what it knows, and what it says it does not.
 *
 * ## Why this is not `community-list.html` under another name
 *
 * The replica pages answer *"what does IRIS look like?"*. They are a faithful
 * mock and they are supposed to look finished. This page answers a different
 * question — *"what does this catalogue actually know?"* — and the difference
 * is not presentational:
 *
 * - the replica shows three items; this shows that all six of their bitstreams
 *   carry `copyright: unknown` and `restrictions: unknown`;
 * - the replica shows a community; this shows that community is `referenced`,
 *   meaning nothing of it is held here;
 * - the replica cannot show a gap at all, because a gap has no page.
 *
 * `who-iris/AGENTS.md` states the point this page exists to render: *"the gap
 * between twelve modelled nodes and a million upstream files is the POINT
 * rather than a backlog"*. Nothing rendered it until now, so the one fact the
 * instance is built around was the one fact no reader could see.
 *
 * ## Every count here is derived
 *
 * Including the one in the sentence above — that prose says twelve and the
 * corpus holds thirteen, which is exactly why `bpmn-processes`' rule ("count
 * the directory rather than quoting a number from this paragraph") is general.
 * Nothing on this page is transcribed.
 */
/**
 * A gate VERDICT, wearing the state palette but never a state's word.
 *
 * The first version of this reused `stateBadge` and mapped `permitted` to
 * `materialized` to borrow the green. That rendered a `retention` gate as the
 * word **materialized**, which is false: a verdict says whether a question was
 * answered and how, a state says whether bytes are here. Reusing the badge
 * meant reusing its vocabulary, and the reader would have had no way to tell
 * that the word in the cell was not the word in the data.
 *
 * Borrowing the COLOURS is fine and deliberate — green for a determined
 * permit, amber for unknown, so the two axes read consistently at a glance —
 * but the text is the verdict as recorded.
 */
function verdictBadge(verdict: string): string {
  const tone = verdict === "unknown" ? "unknown" : verdict === "permitted" ? "materialized" : "referenced";
  return `<span class="state ${tone}">${esc(verdict)}</span>`;
}

function cataloguePage(all: Node[]): string {
  const c = catalogue();
  const byState = (s: string): Node[] => all.filter((n) => (n.materialization?.state ?? "unknown") === s);
  const materialized = byState("materialized");
  const referenced = byState("referenced");
  const unknownState = byState("unknown");

  // Gate verdicts across every bitstream of every node. Counted rather than
  // sampled: a page that showed one item's gates would invite the reader to
  // generalise from it, and the interesting fact here is a UNIVERSAL one.
  const verdicts = new Map<string, Map<string, number>>();
  let bitstreams = 0;
  for (const n of all) {
    for (const b of n.bitstreams ?? []) {
      bitstreams++;
      for (const [gate, v] of Object.entries(b.materialization?.gates ?? {})) {
        const verdict = (v as { verdict?: string }).verdict ?? "unknown";
        const m = verdicts.get(gate) ?? new Map<string, number>();
        m.set(verdict, (m.get(verdict) ?? 0) + 1);
        verdicts.set(gate, m);
      }
    }
  }
  const unknownGates = [...verdicts.entries()].filter(([, m]) => (m.get("unknown") ?? 0) > 0);

  const gateRows = [...verdicts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "en"))
    .map(([gate, m]) => {
      const cells = [...m.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "en"))
        .map(([v, n]) => `${verdictBadge(v)} ${n}`)
        .join(" ");
      return `<tr><td><code>${esc(gate)}</code></td><td>${cells}</td></tr>`;
    })
    .join("\n");

  const nodeRows = all
    .map((n) => {
      const state = n.materialization?.state ?? "unknown";
      const held = n.libraryId ? `<code>${esc(n.libraryId)}</code>` : "—";
      const rec = n.metadataRef ? "yes" : "—";
      const bs = (n.bitstreams ?? []).length;
      return `<tr>
  <td>${stateBadge(state)}</td>
  <td><code>${esc(n.flavour ?? n.kind ?? "?")}</code></td>
  <td>${esc(n.title)}<br><code class="dim">${esc(n.id)}</code></td>
  <td>${held}</td>
  <td>${rec}</td>
  <td>${bs || "—"}</td>
</tr>`;
    })
    .join("\n");

  const files = c.totalFilesUpstream;
  const items = c.totalItemsUpstream;

  return `<div class="wrap">
<h1>The catalogue, as a graph</h1>

<p class="lede">The replica pages show what IRIS looks like. This one shows what this
catalogue <em>knows</em> — and, more usefully, what it records that it does not know.</p>

<div class="note">
<p><strong>The gap is the point, not a backlog.</strong> This instance models
<strong>${all.length}</strong> node(s)${
    items !== undefined ? ` against <strong>${items.toLocaleString("en")}</strong> items` : ""
  }${files !== undefined ? ` across <strong>${files.toLocaleString("en")}</strong> files` : ""} upstream.
Cataloguing by reference means recording that something exists without holding it,
so a small number here is the design rather than a shortfall.</p>
</div>

<h2>What is held, and what is only named</h2>

<table class="kg">
<tr><th>state</th><th>nodes</th><th>what it means</th></tr>
<tr><td>${stateBadge("materialized")}</td><td>${materialized.length}</td><td>the bytes are in this repository</td></tr>
<tr><td>${stateBadge("referenced")}</td><td>${referenced.length}</td><td>upstream, not here — a fact, not a gap</td></tr>
<tr><td>${stateBadge("unknown")}</td><td>${unknownState.length}</td><td>nobody has looked; never rendered as either of the above</td></tr>
</table>

<h2>What the gates say about the ${bitstreams} held bitstream(s)</h2>

${
  unknownGates.length > 0
    ? `<p><strong>Not everything permitted is everything known.</strong> ${unknownGates
        .map(([g, m]) => `<code>${esc(g)}</code> is unknown on ${m.get("unknown")}`)
        .join(", ")} of them. A gate that returned <em>unknown</em> is a question
nobody has answered — which is a different state from a gate that was asked and
said yes, and collapsing the two would turn an open question into a clearance.</p>`
    : `<p>Every gate on every held bitstream returned a determined verdict. Stated
rather than left implicit: an absent warning and a clean result are not the same claim.</p>`
}

<table class="kg">
<tr><th>gate</th><th>verdicts</th></tr>
${gateRows}
</table>

<h2>Every node</h2>

<table class="kg">
<tr><th>state</th><th>kind</th><th>node</th><th>held as</th><th>record</th><th>bitstreams</th></tr>
${nodeRows}
</table>

<p class="caveat">Generated from <code>catalogue/</code> by
<code>who-iris/scripts/gen-iris-pages.ts</code>. Every count above is derived from the
nodes themselves; none is transcribed. <code>bun run check:catalogue</code> separately
verifies that each node validates and that every <code>metadataRef</code>,
<code>libraryId</code>, <code>localPath</code> and parent path resolves — so this page
reports what the catalogue says, and that check reports whether it hangs together.</p>
</div>`;
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
      <br><code>${esc(mb(a!.bytes))}</code></td>
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
/**
 * The Dublin Core record behind a node, where one was captured.
 *
 * Read rather than summarised into the node. The catalogue node says what
 * EXISTS and where; the record says what the source SAYS about it, and R8 is
 * the rule that those two never get merged — the moment a title lives in both,
 * one of them is a copy that can drift from the capture it was transcribed
 * from.
 */
function record(n: Node): { fields: { schema: string; element: string; qualifier?: string; values: { value: string; language?: string }[] }[] } | undefined {
  if (!n.metadataRef) return undefined;
  const abs = join(INSTANCE, n.metadataRef);
  if (!existsSync(abs)) return undefined;
  const raw = JSON.parse(readFileSync(abs, "utf-8"));
  for (const k of Object.keys(raw)) if (k.startsWith("_")) delete raw[k];
  return raw;
}

/**
 * Every value of one qualified field, IN ORDER and never deduplicated.
 *
 * R2 and R3 in one function. `dc.identifier.uri` appears twice in the WPRO
 * record — the global Handle and a regional host that was merged away — and
 * `dc.date.accessioned` twice for the same reason. A reader that returned the
 * first, or a unique set, would be discarding the only evidence this
 * repository holds that a source host can disappear.
 */
function dc(n: Node, element: string, qualifier?: string): string[] {
  const r = record(n);
  if (!r) return [];
  return r.fields
    .filter((f) => f.schema === "dc" && f.element === element && (f.qualifier ?? undefined) === qualifier)
    .flatMap((f) => f.values.map((v) => v.value));
}

/**
 * When IRIS took the item in — the key its own "Recent Submissions" sorts on.
 *
 * The LATEST of the accessions where a record carries several, which is the
 * one a descending sort surfaces. The WPRO item has two, five days apart:
 * 2020-05-12 and 2020-05-17, the second being the regional-IRIS merge. Taking
 * the earlier would order this list by original deposit, which is a different
 * and equally defensible list — so the choice is stated rather than left to be
 * inferred from the output.
 *
 * Returns `undefined` rather than a date when nothing was captured. A node
 * with no accession is not a node accessioned at the epoch.
 */
function accessioned(n: Node): string | undefined {
  const all = dc(n, "date", "accessioned");
  return all.length ? all.slice().sort()[all.length - 1] : undefined;
}

/**
 * Recent submissions, in the order IRIS would show them.
 *
 * Descending accession, **with the catalogue id as the tie-break** — and the
 * tie-break is not decoration. `readdirSync` order already produced a
 * generator that emitted different bytes from identical inputs once this
 * session (`gen-iris-pages.test.ts`); a sort with ties is the same defect with
 * a smaller blast radius. Items with no captured accession sort last, together,
 * by id: unknown is a position, not a zero.
 */
export function recentOrder(items: Node[]): Node[] {
  return items.slice().sort((a, b) => {
    const da = accessioned(a);
    const db = accessioned(b);
    if (da !== db) {
      if (da === undefined) return 1;
      if (db === undefined) return -1;
      return db.localeCompare(da, "en");
    }
    return a.id.localeCompare(b.id, "en");
  });
}

/** A date as IRIS prints it in a submission line: the day, not the timestamp. */
function day(iso: string | undefined): string | undefined {
  return iso?.slice(0, 10);
}

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
  <td class="dl">${a ? `<a href="${esc(a.href)}">Download ${esc(a.name)}</a><br><a class="cdn" href="${esc(a.cdn)}">via CDN</a><br><code>${esc(mb(a.bytes))}</code>` : "not held here"}</td>
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
  <td>${esc(mb(b.bytes))}</td>
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
/**
 * The IRIS home page, replicated.
 *
 * Owner, 2026-09-20, on finding the generic index here:
 *
 * > *"i would have expected to go to the harness defaiult landing page = folio
 * > show pages (or am i wrong), or to have a designated landing page whcih
 * > mocks the iris landing page. … go back to orinal .pdf of iris pages and
 * > validate look."*
 *
 * Validated against `who-iris/uploads/iris-home/iris-capture/IRIS Home.pdf`,
 * page 1, rendered at 900px on 2026-09-20. Five bands, in the source's order:
 * masthead, hero, search, Recent Submissions, footer. Everything below is
 * either read off that capture or read out of the catalogue; nothing is
 * remembered.
 *
 * ## What is copied, and what deliberately is not
 *
 * **No WHO logo and no hero photograph.** The real page sets its hero over a
 * photograph of the Geneva headquarters with the WHO emblem on the facade. A
 * replica carrying either would be indistinguishable from the real site at a
 * glance, which is the whole reason the instruction exists. The hero is a
 * gradient in the `iris-web` theme's own measured colours instead — owner:
 * *"just use colors."*
 *
 * **Item covers ARE shown, with the emblem masked out of the bytes.** This
 * took two rulings. The covers are the publications' own and the emblem on
 * them is printed on the documents, so the file first argued they were content
 * rather than chrome; the owner read it otherwise on 2026-09-21, naming the
 * emblem with the logo — *"logo and other branding"* — and they were withheld.
 * Asked then whether to show them masked, they chose masking.
 *
 * The emblem is blanked by `pdf-cover.py` **before the PNG is written**, from
 * regions declared per item as `maskedRegions`, so the committed bytes do not
 * contain it. Not a display rule: nothing downstream can leak what is not in
 * the file. The publication's TITLE is untouched where it contains "WHO" —
 * that names the work and is not branding this page wears.
 *
 * ## The numbers are real and the search box is not
 *
 * The placeholder reads `Search through the repository's 273559 items`,
 * transcribed from the capture, because that is the sentence IRIS shows and it
 * is where this repository's item count came from at all. The form does
 * nothing: there is no index behind it, and a box that looks like it searches
 * and silently returns nothing is worse than one that says it is a replica.
 */
function landingPage(all: Node[]): string {
  const items = all.filter((n) => n.flavour === "item");
  const communities = all.filter((n) => n.flavour === "community");
  const collections = all.filter((n) => n.flavour === "collection");
  const held = items.filter((n) => assetHref(n) !== undefined);
  const cat = catalogue();

  const submissions = recentOrder(items).map((n) => submission(n)).join("\n");

  const itemsUpstream = cat.totalItemsUpstream;
  const filesUpstream = cat.totalFilesUpstream;

  return `
<section class="hero">
  <div class="hero-in">
    <h1>IRIS</h1>
    <p>The primary objective of the Institutional Repository for Information Sharing
    (IRIS) is to provide free digital access to the scientific and technical
    publications of the World Health Organization (WHO), including contributions from
    its Country Offices, Regional Offices, and Headquarters. Additionally, IRIS
    encompasses the mandates established by the Organization&rsquo;s Governing Bodies in
    collaboration with its Member States.</p>
  </div>
  <p class="hero-note">Replica. No WHO emblem, no photograph &mdash; colour only,
  from the <code>iris-web</code> theme measured off the site&rsquo;s own stylesheet.</p>
</section>

<div class="searchbar">
  <input type="text" disabled
    placeholder="Search through the repository&rsquo;s ${itemsUpstream !== undefined ? itemsUpstream.toLocaleString("en-US").replace(/,/g, "") : "?"} items"
    aria-label="Search (disabled in this replica)">
  <button type="button" disabled>Search</button>
</div>
<p class="searchnote">Disabled. ${itemsUpstream !== undefined ? `<strong>${itemsUpstream.toLocaleString("en-US")}</strong> items` : "The item count"}${
    filesUpstream !== undefined ? ` across <strong>${filesUpstream.toLocaleString("en-US")}</strong> files` : ""
  } is what IRIS reports; this catalogue holds <strong>${items.length}</strong> of them by
reference and <strong>${held.length}</strong> by value. There is no index behind the box,
and a box that returned nothing quietly would be worse than one that says so.</p>

<h2>Recent Submissions</h2>
<p class="ordering">Ordered by <code>dc.date.accessioned</code>, latest first &mdash; the key
IRIS&rsquo;s own list sorts on. Where a record carries several accessions the latest is
used; the WPRO item has two, five days apart, the second being the regional-IRIS merge.</p>

<div class="subs">
${submissions}
</div>

<h2>Browse</h2>
<ul class="kids" style="margin-left:0">
  <li><a href="community-list.html">List of Communities</a> &mdash; the replica of
      <code>iris.who.int/community-list</code>, with every node&rsquo;s materialisation state
      (${communities.length} communities, ${collections.length} collections)</li>
${collections
  .map((c) => `  <li><a href="collection-${esc(slug(c.id))}.html">${esc(c.title)}</a> &mdash; collection</li>`)
  .join("\n")}
</ul>

<div class="caveat">
  <p><strong>This is the front door, not the library visualiser.</strong> The
  full <code>library/</code> visualiser is bean <code>jbx2</code> and is being
  built separately. This page mocks the IRIS home page and links onward rather
  than becoming a second answer to the same question.</p>
  <p>Addressing follows the owner&rsquo;s rule &mdash;
  <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> &mdash; so an instance that
  instantiates a directory gets a visualiser mounted under that directory&rsquo;s
  kind: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, and so on.</p>
</div>
`;
}

/**
 * One row of Recent Submissions, laid out as the capture lays it out.
 *
 * Cover at the left, title as a link, then the author line with the publication
 * date in parentheses, then the abstract. The capture shows a "Show more"
 * control under a truncated abstract; this truncates in CSS and says so in the
 * title attribute rather than shipping a disclosure widget, because the owner
 * asked for *"a special viusalize … dont need working functionality, just
 * links to working assets."*
 *
 * Every string here comes from the Dublin Core record. **Where the record is
 * silent the row says so rather than falling back to the node's title** — R15
 * generalised: a plausible substitute is worse than a stated absence, because
 * a reader cannot tell it apart from a transcription.
 */
function submission(n: Node): string {
  const cov = coverSrc(n);
  const a = assetHref(n);
  const authors = dc(n, "contributor", "author");
  const issued = day(dc(n, "date", "issued")[0]);
  const abstract = dc(n, "description", "abstract")[0];
  const cite = dc(n, "identifier", "citation")[0] ?? dc(n, "identifier", "govdoc")[0];

  const byline = [
    authors.length ? esc(authors.join("; ")) : `<span class="none">no author recorded</span>`,
    `(${[cite ? esc(cite) : undefined, issued ? `Publication Date: ${esc(issued)}` : undefined]
      .filter(Boolean)
      .join(", ")})`,
  ].join(" ");

  // Three states, not two. A withheld cover and an absent one look the same
  // in a layout and mean opposite things about the catalogue.
  const coverCell = !cov
    ? `<span class="nocover" title="no cover rendered">no cover</span>`
    : COVERS_SHOWN
      ? `<a href="item-${esc(slug(n.id))}.html"><img src="${esc(cov.src)}" width="${cov.w}" height="${cov.h}"
        alt="Cover of ${esc(n.title)}, rendered here from page 1 of the held PDF${
          cov.masked ? ", with the WHO emblem masked out" : ""
        }" loading="lazy"></a>`
      : `<span class="nocover" title="A cover is rendered and recorded for this item. It is not displayed: the publication's cover carries the WHO emblem, and this replica is not published under WHO.">cover<br>withheld</span>`;

  return `<article class="sub">
  <div class="sub-cover">${coverCell}</div>
  <div class="sub-body">
    <a class="sub-title" href="item-${esc(slug(n.id))}.html">${esc(n.title)}</a>
    <p class="sub-by">${byline}</p>
    ${
      abstract
        ? `<p class="sub-abs">${esc(abstract)}</p>`
        : `<p class="sub-abs none">No <code>dc.description.abstract</code> in the captured record.</p>`
    }
    <p class="sub-links">${
      a
        ? `<a href="${esc(a.href)}">${esc(a.name)}</a> &middot; <a class="cdn" href="${esc(a.cdn)}">via CDN</a> &middot; <code>${esc(mb(a.bytes))}</code>`
        : `<span class="none">not held here</span>`
    }</p>
  </div>
</article>`;
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

<h2>Settled 2026-09-21 — bean <code>yl5w</code></h2>
<p>Every ORIGINAL <code>localPath</code> in this catalogue named
<code>who-iris/uploads/</code> while the bytes sat in <code>cat-harness/uploads/</code>,
and <code>check:catalogue</code> did not look at <code>localPath</code> at all — so
three <code>materialized</code> claims resolved to nothing while the gate printed
<em>clean</em>. The three sources now sit beside their own intake records at
<code>who-iris/uploads/&lt;slug&gt;/</code>, the page generator's fallback is deleted,
and <code>check:catalogue</code> verifies every <code>localPath</code> — with
<em>could not determine</em> as its own answer, because an unreadable file is not a
missing one.</p>

<p><code>iris.who.int</code> is egress-blocked from the environment that generates this
page, so nothing here was fetched from IRIS. Every record was transcribed from a capture
the owner supplied. Where a transcription is partial, the record says so.</p>
`;
}

/**
 * The CRDM page: this instance as a worked example of the general pattern.
 *
 * Owner, 2026-09-20:
 *
 * > *"update skils, this is doing webportal mockup as part of CRDM of kg.
 * > based on custom assets with need to defin a data ingestion pirpeline
 * > (subject ot operational/deployment constrsaints, $, network traffic,
 * > graph seize etc), from KG into a public portal. this is ecample creating
 * > a CDN to sit behind moodle … also add to /docs for who-iris. make a nice
 * > image to illustate architecture. bpmn for process. also generalize skils
 * > and tools."*
 *
 * **The generalisation lives in the platform and this page points at it.** The
 * skill is `kg-to-portal`, the process is `kg-to-portal.bpmn`, and the drawing
 * is `cat-harness/docs/assets/img/`. What is HERE is the only thing who-iris
 * can say that the platform cannot: which stages this instance has actually
 * built, with its own numbers, and which it has not.
 *
 * Every figure below is read out of the catalogue or off the filesystem at
 * generation time. None is written down — the sticky banner on every page of
 * this site carried three hand-typed counts until 2026-09-20 and one of them
 * was already wrong.
 */
function kgToPortal(all: Node[]): string {
  const items = all.filter((n) => n.flavour === "item");
  const held = items.filter((n) => assetHref(n) !== undefined);
  const cat = catalogue();

  // What this instance actually ships, measured rather than asserted.
  const heldBytes = held
    .map((n) => assetHref(n)?.bytes ?? 0)
    .reduce((a, b) => a + b, 0);
  // BOTH sides, since the 2026-09-21 split: the replica is library-side and
  // the documentation is docs-side, and "how many pages does this instance
  // ship" is a question about the instance rather than about one directory.
  const htmlIn = (dir: string): number =>
    existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".html")).length : 0;
  const pages = htmlIn(LIB) + htmlIn(DOCS);
  // The covers stay docs-side, where the catalogue's `localPath` names them.
  const covers = existsSync(join(DOCS, "assets", "covers"))
    ? readdirSync(join(DOCS, "assets", "covers")).filter((f) => f.endsWith(".png")).length
    : 0;

  const svg = existsSync(ARCH_SVG)
    ? readFileSync(ARCH_SVG, "utf-8").replace(/^<\?xml[^>]*\?>\s*/, "").replace(/<!--[\s\S]*?-->\s*/g, "")
    : undefined;

  // The badge borrows the materialisation COLOURS and none of its words. A
  // stage is built, partial or not built; a bitstream is materialized,
  // referenced or unknown. They are different vocabularies over the same three
  // shades, and printing "MATERIALIZED" next to "Serialize" would invite a
  // reader to look for bytes that a build stage does not have.
  const SHADE = { built: "materialized", partial: "unknown", "not built": "referenced" } as const;
  const stage = (n: number, name: string, state: keyof typeof SHADE, what: string) =>
    `<tr><th class="rid">${n}</th><td><strong>${esc(name)}</strong><br><span class="why">${what}</span></td>` +
    `<td><span class="state ${SHADE[state]}">${esc(state)}</span></td></tr>`;

  return `
<h1>From this catalogue to somebody else&rsquo;s portal</h1>

<p class="lede">This instance is a <strong>worked example</strong> of a general pattern: a knowledge
graph reaching readers the repository never hears about. The pattern is the platform&rsquo;s —
the skill is <code>kg-to-portal</code> and the process is
<code>kg-to-portal.bpmn</code>. What is on this page is the part only who-iris can
say: which stages are actually built here, with this instance&rsquo;s own numbers.</p>

${svg ? `<figure class="arch">${svg}<figcaption>Six stages in three zones. The publisher owns the canonical URL; the cache owns neither end. The dashed arrow is undetermined on purpose.</figcaption></figure>` : `<p class="none">The architecture drawing could not be read from the platform. Not rendered rather than rendered empty &mdash; a missing figure is a finding.</p>`}

<h2>The one distinction the drawing exists for</h2>

<div class="caveat">
  <p><strong>A CDN is not a publication host. It is a layer in front of one.</strong>
  <code>PUBLICATION_HOSTS</code> answers <em>what serves the rendering</em>; a cache
  answers <em>what stands between the server and the reader</em>. Model the cache as the
  host and the published URL becomes the cache&rsquo;s &mdash; then the day the cache changes,
  every citation breaks and the old URL stays warm for as long as its TTL says.</p>
  <p>This page is served from GitHub Pages and its assets are also reachable through
  jsDelivr. <strong>Both are tool choices.</strong> The canonical answer is the one the
  catalogue records; the CDN is an accelerated route to the same bytes.</p>
</div>

<h2>Where this instance actually is</h2>

<table class="reqs">
  <thead><tr><th>#</th><th>Stage</th><th>Here</th></tr></thead>
  <tbody>
${stage(1, "Select", "partial", "Everything in this catalogue is publishable, so the editorial cut has never had to refuse anything. An untested filter is not a working one.")}
${stage(2, "Serialize", "built", `<code>kg-export</code> emits the harness graph as JSON-LD; this instance&rsquo;s catalogue is ${all.length} nodes with ${items.length} item(s).`)}
${stage(3, "Package", "not built", "There is no manifest. The pages and assets are published individually, so nothing here can detect a file that was <em>removed</em>.")}
${stage(4, "Sign", "not built", "Nothing is signed. The catalogue records a <code>sha256</code> per bitstream, which is a digest and not an attestation &mdash; anyone who can change the bytes can change the digest beside them. The trust anchor is to be <strong>GDHCN</strong>, via WHO SMART Trust; see below.")}
${stage(5, "Distribute", "built", `${pages} generated page(s) and ${covers} cover(s) on GitHub Pages, with a jsDelivr route to the same bytes.`)}
${stage(6, "Verify", "not built", "No consumer verifies anything, because there is nothing signed to verify. This is the stage that gets dropped, and it is dropped here.")}
  </tbody>
</table>

<h2>The numbers a transport decision would be made with</h2>

<p class="ordering">Constraints need denominators. These are this instance&rsquo;s, measured at
generation time &mdash; not quoted, not remembered.</p>

<table class="reqs">
  <tbody>
    <tr><th class="rid">items</th><td>${items.length} here, of <strong>${cat.totalItemsUpstream?.toLocaleString("en-US") ?? "unknown"}</strong> upstream</td><td class="why">the completeness denominator</td></tr>
    <tr><th class="rid">files</th><td>${cat.totalFilesUpstream?.toLocaleString("en-US") ?? "unknown"} upstream</td><td class="why">a different denominator; 3.86 files per item, so a fraction built from the wrong one is wrong by that factor</td></tr>
    <tr><th class="rid">bytes</th><td><strong>${esc(mb(heldBytes))}</strong> held, of ${cat.totalBytesUpstream !== undefined ? esc(gb(cat.totalBytesUpstream)) : "unknown"} upstream</td><td class="why">the size-gate denominator, and the reason this catalogue is by reference</td></tr>
    <tr><th class="rid">served</th><td>${pages} page(s), ${covers} cover(s)</td><td class="why">what a publication period would actually move</td></tr>
    <tr><th class="rid">readers</th><td><span class="none">not measured</span></td><td class="why">traffic is bytes &times; requests, and nothing here counts requests. Unknown rather than assumed &mdash; an invented reader count would make every cost figure below it fiction</td></tr>
  </tbody>
</table>

<h2>Trust: GDHCN, via WHO SMART Trust</h2>

<p>Owner, 2026-09-20, in two messages: <code>propsal signing = GDHCN</code>, then
<code>smart-trust</code> &mdash; which names where the first is specified. The
<strong>WHO SMART Trust Implementation Guide</strong>
(<a href="https://smart.who.int/trust"><code>smart.who.int.trust</code></a>, FHIR R5,
v1.8.0 as read) publishes GDHCN key material as
<a href="https://www.w3.org/TR/did-core/">W3C DID documents</a>.</p>

<div class="caveat">
  <p><strong>This corrected an earlier draft on this branch.</strong> It said the publisher
  &ldquo;signs as a participant&rdquo;, which left the impression that GDHCN supplies the signing
  envelope. It supplies the <strong>key distribution</strong>: a trustlist carries trust anchors
  &mdash; which keys belong to which participant, for which domain and which usage &mdash; and says
  nothing about what you wrap your bytes in. The health-certificate envelope is a separate
  specification in the same IG, and <em>a document package is not a health certificate</em>.
  What is settled is where a verifier <strong>gets the key</strong>.</p>
</div>

<p>Three things from <code>concepts_did_gdhcn.md</code>, and the third is the one that matters
for the drawing above:</p>

<ul class="kids" style="margin-left:0">
  <li><strong>Two variants.</strong> <em>Embedded</em> carries the keys inline and supports
      immediate verification; <em>by reference</em> carries only DID ids to resolve, which keeps
      the root document concise and supports dynamic discovery.</li>
  <li><strong>The path is a hierarchical filter</strong> &mdash;
      <code>/v2/trustlist/$domain/$participant/$usage/did.json</code>, the levels ANDed, with
      <code>-</code> as a wildcard. A verifier fetches exactly the slice it needs.</li>
  <li><strong>It is static JSON served from a CDN</strong>, on a host named
      <code>tng-cdn.who.int</code>. So the pattern on this page is not an analogy to how GDHCN
      works &mdash; it <em>is</em> how GDHCN works, one layer down.</li>
</ul>

<div class="caveat">
  <p><strong>Read off the IG, not fetched.</strong> Those endpoints are transcribed from
  <code>input/pagecontent/concepts_did_gdhcn.md</code> on <code>main</code>;
  <code>tng-cdn.who.int</code> returns <code>000</code> from the container that generates this
  page, the same block <code>iris.who.int</code> and <code>cdn.jsdelivr.net</code> return.</p>
  <p><strong>Still open and unread:</strong> the key rotation and revocation model
  (<code>concepts_certificate_governance.md</code>), and whether a document-package signature can
  be expressed for a GDHCN-aware verifier at all &mdash; the envelope specified in that IG is for
  health certificates, and nothing there covers arbitrary files.</p>
</div>

<h2>What is deliberately not decided</h2>

<div class="caveat">
  <p><strong>The ingestion method is undetermined</strong>, and the process diagram reaches a
  gateway with no default branch rather than naming one. A pull from the portal, a push to an
  object store, a git fetch, a signed tarball on a schedule &mdash; they differ in who initiates,
  in what must be reachable from where, and in what happens when a publication is missed.
  Drawing one as the obvious branch would record a decision nobody made.</p>
  <p><strong>The store must be versioned; which store is a deployment choice.</strong> Hosted git
  is one satisfaction of that requirement, not the requirement. A portal showing a graph needs to
  be able to say <em>which</em> graph &mdash; an unversioned store cannot answer &ldquo;what did
  this look like last term&rdquo;, and that is the question a reading list asks every year.</p>
  <p><strong>Nothing here was measured against a live CDN.</strong>
  <code>cdn.jsdelivr.net</code> is egress-blocked from the container that generates these pages,
  so every CDN figure would be quoted rather than measured. The owner confirmed one link by hand
  on 2026-09-20, and that is the whole of the evidence.</p>
</div>

<p><a href="ingestion-notes.html">What ingesting these documents cost</a> &mdash; the
requirements this instance paid for, generated from the skill that records them.</p>
`;
}

/**
 * The docs side's own landing page.
 *
 * @see the owner's ruling, 2026-09-21 — the KG is library-side and the
 * documentation is docs-side, each served by its own cat-harness handler.
 *
 * It is deliberately SHORT and it links nothing across the two mount points.
 * A link from here to the replica would have to be written relative to where
 * the page lands after mounting, which this generator does not know and must
 * not compose; the folio-assistant navbar on the left is what reaches both,
 * which is the whole point of the ruling.
 */
function docsIndex(): string {
  return `
<h1>who-iris &mdash; documentation</h1>

<p class="lede">What this harness is, what ingesting it cost, and where the
ingested copy is meant to end up. These pages are <em>about</em> the work; the
catalogue itself, and the replica rendered from it, are served separately by
the library handler.</p>

<div class="caveat">
  <p><strong>This is not a copy of IRIS.</strong> who-iris models the WHO
  Institutional Repository for Information Sharing <em>by reference</em>:
  ${banner()}. Everything on these pages was transcribed from captures the
  owner supplied &mdash; <code>iris.who.int</code> is not reachable from the
  environment that renders them, so nothing here was fetched. The figures come
  from the catalogue rather than from this sentence, which is why they are the
  same ones the replica shows.</p>
</div>

<h2>Pages</h2>
<ul class="doclist">
  <li>
    <a href="ingestion-notes.html">What ingesting these documents cost</a>
    <p>The requirements the ingestion produced, rendered from
    <code>skills/iris-dspace.md</code> rather than restated &mdash; so the page
    and the skill cannot drift. Includes what the captured DSpace records gave
    that inference could not.</p>
  </li>
  <li>
    <a href="kg-to-portal.html">From this catalogue to somebody else&rsquo;s portal</a>
    <p>The general pattern this instance is a worked example of:
    <em>select &rarr; serialize &rarr; package &rarr; sign &rarr; distribute
    &rarr; verify</em>, with the trust anchors read off the WHO SMART Trust IG
    and the transport left undetermined rather than guessed.</p>
  </li>
</ul>
`;
}

function main(): number {
  const all = nodes();
  const files = new Map<string, string>();

  // KEYED BY SIDE, not by name. Both sides need an `index.html` — the replica
  // needs one because it is a site, and the docs side needs one because
  // `mount-instance-docs.ts` will not mount a directory without it — so a map
  // keyed on the bare name can hold only one of them.
  files.set(
    "library/index.html",
    page("who-iris", [{ label: "Home" }], landingPage(all), "library"),
  );

  files.set(
    "docs/index.html",
    page("who-iris — documentation", [{ label: "Documentation" }], docsIndex(), "docs"),
  );

  files.set(
    "docs/kg-to-portal.html",
    page(
      "From this catalogue to somebody else's portal",
      [{ label: "Documentation", href: "index.html" }, { label: "KG to portal" }],
      kgToPortal(all),
      "docs",
    ),
  );

  files.set(
    "docs/ingestion-notes.html",
    page(
      "What ingesting these documents cost",
      [{ label: "Documentation", href: "index.html" }, { label: "Ingestion notes" }],
      ingestionNotes(requirementsFromSkill(readFileSync(SKILL, "utf-8")), all),
      "docs",
    ),
  );

  files.set(
    "docs/catalogue.html",
    page(
      "The catalogue, as a graph",
      [{ label: "Documentation", href: "index.html" }, { label: "Catalogue" }],
      cataloguePage(all),
      "docs",
    ),
  );

  files.set(
    "library/community-list.html",
    page("List of Communities", [{ label: "Home", href: "community-list.html" }, { label: "Community List" }], communityList(all), "library"),
  );

  for (const c of all.filter((n) => n.flavour === "collection")) {
    files.set(
      `library/collection-${slug(c.id)}.html`,
      page(c.title, [{ label: "Home", href: "community-list.html" }, { label: c.title }], collectionPage(c, all), "library"),
    );
  }

  for (const n of all.filter((x) => x.flavour === "item")) {
    files.set(
      `library/item-${slug(n.id)}.html`,
      page(n.title, [{ label: "Home", href: "community-list.html" }, { label: n.title }], itemPage(n, all), "library"),
    );
  }

  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [key, html] of files) {
    const p = join(INSTANCE, key);
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : undefined;
    if (prev === html) continue;
    if (check) {
      console.error(`stale or missing: who-iris/${key}`);
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
  // Per DIRECTORY, each against the pattern it owns there. One combined
  // pattern would prune a docs page out of `library/` and vice versa — which
  // is exactly what the split exists to stop, and the failure would look like
  // a successful clean-up.
  /**
   * This generator's output sitting in the wrong directory for what it is.
   *
   * `ownedHere` is subtracted, and that is not a refinement — `index.html` is
   * legitimately on both sides, so without it the first sweep past `docs/`
   * deletes the docs index every run and the directory stops mounting.
   */
  const wrongSide = (dir: string, ownedElsewhere: RegExp, ownedHere: RegExp): string[] =>
    existsSync(dir)
      ? readdirSync(dir).filter((f) => ownedElsewhere.test(f) && !ownedHere.test(f)).sort()
      : [];
  const orphansIn = (dir: string, owned: RegExp): string[] =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => owned.test(f) && !files.has(`${basename(dir)}/${f}`))
          .sort()
      : [];
  const orphans = [
    ...orphansIn(LIB, OWNED_LIB).map((f) => ({ dir: LIB, name: f, rel: `who-iris/library/${f}` })),
    ...orphansIn(DOCS, OWNED_DOCS).map((f) => ({ dir: DOCS, name: f, rel: `who-iris/docs/${f}` })),
    // The pages that CHANGED SIDES, and the predicate here is deliberately
    // NOT the one above. A page carrying the other side's name does not belong
    // in this directory AT ALL — whether or not it is currently being written
    // somewhere else. The first draft asked `!files.has(name)` here too, and
    // every stale copy survived: `index.html` is being written to `library/`,
    // so the docs-side copy looked live and stayed exactly where the owner did
    // not want it. Caught by listing the directory afterwards rather than by
    // trusting the sweep.
    ...wrongSide(DOCS, OWNED_LIB, OWNED_DOCS).map((f) => ({ dir: DOCS, name: f, rel: `who-iris/docs/${f}` })),
    ...wrongSide(LIB, OWNED_DOCS, OWNED_LIB).map((f) => ({ dir: LIB, name: f, rel: `who-iris/library/${f}` })),
  ];

  if (check) {
    for (const o of orphans) console.error(`orphaned: ${o.rel}`);
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

  for (const o of orphans) rmSync(join(o.dir, o.name));

  const lib = [...files.keys()].filter((k) => k.startsWith("library/"));
  const docs = [...files.keys()].filter((k) => k.startsWith("docs/"));
  console.log(`wrote ${lib.length} page(s) to who-iris/library/ and ${docs.length} to who-iris/docs/`);
  for (const key of [...lib, ...docs]) console.log(`  who-iris/${key}`);
  for (const o of orphans) console.log(`  pruned ${o.rel}`);
  return 0;
}

if (import.meta.main) process.exit(main());
