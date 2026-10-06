#!/usr/bin/env bun
/**
 * Render the ingested-IRIS replica pages from the catalogue.
 *
 * @module who-iris/scripts/gen-iris-pages
 * @covers catalogue
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
 *   bun run who-iris/scripts/gen-iris-pages.ts --extract-pot
 *
 * ## Six languages (issue #2228)
 *
 * The replica pages are built in English at `site/` and in Arabic, Chinese,
 * French, Russian and Spanish at `site/<locale>/`. The interface's words are
 * the `SITE_STRINGS` table below; `--extract-pot` writes them to each
 * locale's `translations/<locale>/site/iris-site.pot`, and the generator
 * reads the `.po` beside it. A publication's own title, authors and abstract
 * are never translated. `--check` covers the catalogues as well as the pages.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { basename, dirname, join, posix, relative, resolve, sep } from "path";

import {
  bytesFor,
  dcRenderingsFor,
  folioMountFragment,
  formatPot,
  libraryResolver,
  parsePo,
  parsePoEntries,
  pdfViewer,
  publicationBlockers,
  readDeclaration,
  repoRelative,
  repoRootFor,
  resolvableIri,
  siteDirFor,
  subjectPage,
  withInlineCode,
  withRoutes,
  withViewerNav,
  type CatalogueNode,
  type PotEntry,
} from "../platform.ts";
import { whoThemeById } from "../themes/themes.js";


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
 *
 * ## The replica LEFT `library/` on 2026-09-30 — bean `2b5s`
 *
 * Owner, choosing *"site/ + publish covers"*: the replica pages move to their
 * own directory, `site/`, which is the instance root; `library/` holds the
 * corpus only. The 2026-09-21 words place the KG — corpus and materialized
 * content — in `library/`, and say nothing about where its RENDERING lives.
 * Keeping the rendering there meant the build copied the whole corpus (1,367
 * sidecars) to two published routes as if it were pages, because a mount
 * copies the directory whose `index.html` it found.
 *
 * So `LIB` is now the CORPUS side only — the covers the replica shows and the
 * `withheld.json` this generator writes — and `SITE` is where the pages go.
 * The covers are NOT copied into `site/`: a page references
 * `../library/<slug>-cover.png`, which resolves in the checkout, and the
 * mount's referenced-asset rule publishes exactly the files a page embeds
 * (`referencedAssets` in `mount-instance-docs.ts`). A copy here would be a
 * second committed binary of one image, free to drift from the one the
 * catalogue's `localPath` names.
 */
const LIB = join(INSTANCE, "library");
const SITE = join(INSTANCE, "site");
const DOCS = join(INSTANCE, "docs");

/**
 * A THIRD SIDE: the kind viewer, published where the tile model already looks.
 *
 * `library/` and `docs/` above are who-iris's own tree, which the build MOUNTS.
 * This one is not — it is written straight into the built site, because
 * `harnessTiles` discovers a viewer by CONVENTION at `/<handler>/<kind>/<name>/`
 * and links a declared ref only when that ref is under the published site
 * directory, where the published path is the ref with the prefix stripped.
 * A ref inside a mounted tree cannot be stripped, so `catalogue` was built,
 * declared, resolving, and linked by nothing — bean `ha78`, issue #886.
 *
 * NOTHING HERE IS SPELLED. The handler is the harness's declared name, the
 * site directory is asked for rather than composed, and the route comes from
 * `subjectPage` itself — the same function `harnessTiles` discovers with, so
 * the two cannot drift into disagreeing about where this page is. A literal
 * would be a second answer to a question the platform already answers, which
 * is the defect this repository keeps paying for one rename at a time.
 */
const HARNESS_ROOT = join(REPO_ROOT, "cat-harness");
/**
 * The instance's DIRECTORY name, read from its own declaration.
 *
 * `harnessTiles` builds its candidate paths from `decl.name`, so reading the
 * same field is what makes this generator and that discovery agree by
 * construction rather than by both being edited together.
 */
const declNameOf = (root: string, fallback: string): string =>
  readDeclaration(root)?.name ?? fallback;
const HANDLER = declNameOf(HARNESS_ROOT, "cat-harness");
const SUBJECT = declNameOf(INSTANCE, "who-iris");
/**
 * The graph typology this viewer renders, taken from the declaration entry that
 * declares it rather than written down again.
 *
 * `who-iris.json`'s `who-iris-catalogue` entry is the one place that says this
 * directory holds a `catalogue` graph. Re-stating the string here would make
 * a rename of the kind produce a viewer published at the OLD route and a tile
 * looking at the new one — built and unreachable again, by exactly the
 * mechanism this change exists to close.
 */
const CATALOGUE_KIND = ((): string => {
  const dirs = readDeclaration(INSTANCE)?.directories ?? [];
  const entry = dirs.find((d) => d.id === "who-iris-catalogue");
  const kind = (entry?.graphTypologies ?? [])[0];
  if (kind === undefined) {
    throw new Error(
      "who-iris.json declares no graphTypologies on `who-iris-catalogue`, so the catalogue " +
        "viewer has no conventional route to be published at. Declare the kind, or " +
        "this generator is publishing to a path no tile will look at (bean `ha78`).",
    );
  }
  return kind;
})();
/** `<site>/<handler>/<kind>/<subject>/index.html`, absolute. */
const CATALOGUE_VIEWER = join(
  // `siteDirFor` answers with the site directory's name RELATIVE to the
  // instance that declares it -- `docs`, not a path -- so the root goes in
  // front of it. `join(ROOT, siteDirFor(ROOT), ...)` is the idiom every other
  // caller here uses, and dropping the root silently produces a cwd-relative
  // path: the first run of this wrote a stray `docs/cat-harness/` at the
  // repository root and reported success, which is the whole argument for
  // matching the established shape rather than inventing one.
  HARNESS_ROOT,
  siteDirFor(HARNESS_ROOT),
  subjectPage(HANDLER, CATALOGUE_KIND, SUBJECT).replace(/^\//, ""),
  "index.html",
);

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
 * THE ONE PLACE THAT SAYS WHAT THIS GENERATOR OWNS. Everything below derives.
 *
 * Ownership is what licenses the prune sweep to DELETE, so it is deliberately
 * a pattern over this generator's own naming rather than "everything in the
 * directory". `deletion-requires-confirmation` is about durable artefacts an
 * agent did not create; this reclaims only what this file itself emits, the
 * same licence `prunableStickies` operates under. A hand-authored page, an
 * asset directory or a `.nojekyll` beside them is untouched.
 *
 * ## Why one declaration, and why it is split this way
 *
 * There were SIX enumerations of this one fact — `DOC_PAGES` exported here
 * with no consumer anywhere, a LOCAL `DOC_PAGES` in the test reusing the name
 * with different membership, `OWNED`, `OWNED_LIB`, `OWNED_DOCS`, and a
 * `wanted` set in the test. Two were already broken when this was written
 * (bean `o6vj`, issue #895): the exported `DOC_PAGES` was dead, and `OWNED`
 * still named `catalogue` after #888 moved that page out of who-iris.
 *
 * `catalogue.html` was written to `docs/` and named in NEITHER side's
 * pattern, so the sweep could never have reclaimed it — and that sweep is not
 * decorative: re-keying two items on 2026-09-20 left nine files where seven
 * were wanted, two serving records the catalogue no longer described.
 *
 * FIXED vs FAMILIES is the load-bearing split. Deriving ownership wholesale
 * from what is being written this run would delete the property the sweep
 * exists for: `item-*.html` must stay prunable when the item is GONE, which
 * is precisely when it is absent from the write set. So the families stay
 * explicit patterns, and only the fixed names — the class `catalogue` fell
 * through — are enumerated once here.
 */
/**
 * The languages the replica is BUILT in besides English — the five other UN
 * languages (issue #2228). Each gets its own copy of every site-side page at
 * `site/<locale>/<page>.html`, the layout the docs locale globe already links
 * to. Declared up here because the ownership patterns below are built from it.
 */
export const SITE_LOCALES = ["ar", "es", "fr", "ru", "zh"] as const;
type Locale = "en" | (typeof SITE_LOCALES)[number];

const PAGES = {
  site: {
    /** The replica: the KG rendered. */
    fixed: ["index", "community-list"],
    /** One page per collection and per item; prunable when the node is gone. */
    families: ["collection-.*", "item-.*"],
  },
  docs: {
    /**
     * Prose about the work, plus an index.
     *
     * `index` is owned on BOTH sides deliberately: the replica needs one
     * because it is a site, and the docs side needs one because
     * `mount-instance-docs.ts` will not mount a directory without it. The
     * cross-side sweep therefore subtracts what is owned HERE, or it deletes
     * the docs index on sight.
     */
    fixed: ["index", "ingestion-notes", "kg-to-portal"],
    families: [] as string[],
  },
} as const;

/** The sides a page can be written to — the keys, never a second list. */
export type Side = keyof typeof PAGES;
export const SIDES = Object.keys(PAGES) as Side[];

const ownedPattern = (names: readonly string[]): RegExp =>
  new RegExp(`^(${names.join("|")})\\.html$`);

/**
 * What it owns in `site/` — including each language's copy beneath
 * `site/<locale>/`, which is the page's name with the locale in front. The
 * sweeps below list one directory at a time, so a bare name never carries a
 * slash and this pattern means exactly what it did for them.
 */
export const OWNED_SITE = new RegExp(
  `^(?:(?:${SITE_LOCALES.join("|")})/)?(${[...PAGES.site.fixed, ...PAGES.site.families].join("|")})\\.html$`,
);

/** What it owns in `docs/`. */
export const OWNED_DOCS = ownedPattern([...PAGES.docs.fixed, ...PAGES.docs.families]);

/**
 * Everything this generator writes, on either side.
 *
 * A union of the two above rather than a third hand-written pattern. It named
 * `catalogue` for a day after that page left the repository, which is what a
 * third answer to one question buys you.
 */
export const OWNED = ownedPattern([
  ...new Set(SIDES.flatMap((s) => [...PAGES[s].fixed, ...PAGES[s].families])),
]);

/** The fixed pages of one side, as filenames. Used by the guard and the tests. */
export const fixedPagesOf = (side: Side): string[] =>
  PAGES[side].fixed.map((n) => `${n}.html`);

/** The pattern that governs one side. */
export const ownedOn = (side: Side): RegExp => (side === "site" ? OWNED_SITE : OWNED_DOCS);

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

/*
 * RECORD DATA IS DIRECTION-ISOLATED FROM THE INTERFACE AROUND IT (bean `lffo`).
 *
 * The interface is translated; the records are not — a title, an author, a
 * citation, a collection's name stay as WHO published them. On a right-to-left
 * page that leaves Latin runs sitting inside Arabic sentences, and the Unicode
 * bidi algorithm then resolves the neutral characters at the seam against the
 * PAGE's direction. Measured on the ar home page before this: the WPRO item's
 * citation line rendered as `(12-05-2020 :تاريخ النشر ,WPR/RDO/2020/003)`, and
 * each abstract's truncation ellipsis landed at the left.
 *
 * Two shapes, chosen by where the value sits:
 *
 * - **Inline**, inside a translated sentence or beside a label: {@link data}
 *   wraps it in `<bdi>`, whose direction defaults to `auto`.
 * - **A whole block** (a heading, an abstract): {@link dataBlock} sets
 *   `dir="auto"` on the element itself, so it aligns by its own first strong
 *   character rather than the page's.
 *
 * `auto`, never `ltr`: a record field is not guaranteed to be English, and an
 * Arabic title on the English page needs the same isolation the other way.
 * `lang` only where it is KNOWN — the record's own `dc.language.iso` — and only
 * where it differs from the page's, so a screen reader switches voice for an
 * English title on the Arabic page and the English page gains no noise. A node
 * with no record gets isolation and no `lang`: guessing one would be a claim
 * the catalogue does not make.
 *
 * Values interpolated into an ATTRIBUTE (`title=`, `alt=`) are not wrapped —
 * markup there is text, and an attribute has no direction of its own to fix.
 */

/** ` lang="…"` for a value whose language is known and is not the page's; otherwise nothing. */
function langAttr(lang: string | undefined): string {
  return lang !== undefined && lang !== LOCALE ? ` lang="${esc(lang)}"` : "";
}

/** Record data in running text: escaped, isolated, and language-tagged where known. */
function data(s: string, lang?: string): string {
  return `<bdi${langAttr(lang)}>${esc(s)}</bdi>`;
}

/**
 * A breadcrumb's text. A crumb that names a node (`record` set) is record data
 * and isolated like any other; an interface crumb ("Home") is translated text
 * in the page's own direction and is left as it is.
 */
function crumbLabel(c: { label: string; record?: { lang?: string } }): string {
  return c.record === undefined ? esc(c.label) : data(c.label, c.record.lang);
}

/** The attributes for an element whose whole content is record data. */
function dataBlock(lang?: string): string {
  return ` dir="auto"${langAttr(lang)}`;
}

/**
 * The language a node's own record declares — `dc.language.iso` — or nothing.
 *
 * Shape-checked as a BCP 47 primary tag with optional subtags, because the
 * value is emitted into a `lang` attribute and a malformed one is worse than
 * none: a reader's tools act on it.
 */
function langOf(n: Node): string | undefined {
  const iso = dc(n, "language", "iso")[0]?.trim();
  return iso !== undefined && /^[a-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(iso) ? iso : undefined;
}

/**
 * The language of a catalogue NOTE: English. Notes are not WHO's data — they
 * are written in this repository, in its working language, by whoever
 * catalogued the node — so unlike a record field this one is known.
 */
const NOTE_LANG = "en";

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
  return `${num(bytes / 2 ** 30, 2)} GiB`;
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
  return bytes === undefined ? t("not recorded") : t("{size} MB", { size: num(bytes / 1048576, 2) });
}

/**
 * The bytes actually on disk for an item, or undefined when there are none.
 *
 * HELD is not PUBLISHED (bean `cw35`). `withheld` names the publication gates
 * (`copyright`, `restrictions`) that are not `permitted`, with each verdict and
 * its recorded basis; when it is non-empty no page may link the bytes, and
 * {@link linkOrWithheld} is the one place that decides. Counts of what is held
 * here still count it — the copy exists, it is just not ours to redistribute.
 */
function assetHref(
  n: Node,
): { href: string; cdn: string; name: string; bytes?: number; withheld: string[] } | undefined {
  const b = n.bitstreams?.find(
    (x) => x.bundle !== "THUMBNAIL" && x.materialization?.state === "materialized",
  );
  if (!b) return undefined;
  // Where the bytes ARE, which is not where the catalogue says — bean `yl5w`,
  // and the resolution order is in core's `scripts/lib/bytes.ts` so the workaround has one
  // home to be deleted from.
  const found = bytesFor(INSTANCE, b.materialization?.localPath, b.name);
  if (!found) return undefined;
  const rel = encPath(repoRelative(REPO_ROOT, found));
  const gates = b.materialization?.gates;
  const withheld = publicationBlockers(gates).map(
    (k) => `${k}: ${gates?.[k]?.verdict ?? "not recorded"}${gates?.[k]?.basis ? ` — ${gates[k].basis}` : ""}`,
  );
  return { href: `${RAW}/${rel}`, cdn: `${CDN}/${rel}`, name: b.name, bytes: b.bytes, withheld };
}

/**
 * What the site must not SERVE from `library/`, for the mount to honour
 * (`WITHHELD_FILE` in `mount-instance-docs.ts`, bean `cw35`).
 *
 * Removing a link does not stop a URL: the mount copied `library/` wholesale
 * until bean `2b5s`, so a refused publication's cover and its ingested text
 * stayed reachable. It no longer mounts `library/` at all; it publishes the
 * files a replica page EMBEDS, and it still consults this list for each, so a
 * page that came to embed a withheld cover would be refused rather than
 * served. For
 * every item whose ORIGINAL bitstream's publication gates block, its whole
 * library entry is withheld — the text, figures and structure are derived from
 * the same bytes under the same licence. A blocked THUMBNAIL is withheld on its
 * own gates. The item's catalogue PAGE stays: it is metadata, and it says why.
 */
export function withheldManifest(all: Node[]): string {
  const paths: {
    path: string;
    reason: string;
    gates?: { gate: string; verdict: string }[];
    record?: { id: string; page?: string; uri?: string };
  }[] = [];
  for (const n of all) {
    for (const b of n.bitstreams ?? []) {
      const blocked = publicationBlockers(b.materialization?.gates);
      if (!blocked.length || b.materialization?.state !== "materialized") continue;
      const reason = `${n.id} ${b.bundle} "${b.name}": ${blocked
        .map((k) => `${k} ${b.materialization?.gates?.[k]?.verdict ?? "not recorded"}`)
        .join(", ")}`;
      // The ENTRY carries its gates and its catalogue record as data (issue
      // #1794), so the library viewer can say which gate refused and send the
      // reader to the record without parsing `reason`. The record page is the
      // replica's item page, at the route the declaration gives it; the URI is
      // the item's own resolvable IRI, absent when it records none.
      if (b.bundle === "ORIGINAL" && n.libraryId) {
        const page = replicaPageOf(n);
        const uri = sourceOf(n);
        paths.push({
          path: `${n.libraryId}/`,
          reason,
          gates: blocked.map((k) => ({ gate: k, verdict: b.materialization?.gates?.[k]?.verdict ?? "not recorded" })),
          record: {
            id: n.id,
            ...(page ? { page: `/${REPLICA_ROUTE}/${page}` } : {}),
            ...(uri ? { uri } : {}),
          },
        });
      }
      const lp = b.materialization?.localPath;
      if (b.bundle === "THUMBNAIL" && lp?.startsWith("library/")) paths.push({ path: lp.slice("library/".length), reason });
    }
  }
  paths.sort((a, b) => a.path.localeCompare(b.path));
  return (
    JSON.stringify(
      {
        $schema: "folio-withheld/v1",
        _comment:
          "GENERATED by who-iris/scripts/gen-iris-pages.ts from the catalogue's publication gates (bean cw35). " +
          "mount-instance-docs.ts copies nothing listed here to the site. Do not edit by hand.",
        paths,
      },
      null,
      2,
    ) + "\n"
  );
}

/** The download links for a held item — or why it is held and not linked. */
function linkOrWithheld(a: NonNullable<ReturnType<typeof assetHref>>, withSize: boolean): string {
  if (a.withheld.length > 0) {
    return `<span class="none" title="${esc(a.withheld.join("; "))}">${t("held here, not published — {gates}", { gates: esc(
      a.withheld.map((w) => w.split(" — ")[0]).join(", "),
    ) })}</span>`;
  }
  return (
    `<a href="${esc(a.href)}">${esc(a.name)}</a> &middot; <a class="cdn" href="${esc(a.cdn)}">${t("via CDN")}</a>` +
    (withSize ? ` &middot; <code>${esc(mb(a.bytes))}</code>` : "")
  );
}

/**
 * The cover thumbnail, or nothing.
 *
 * A THUMBNAIL-bundle bitstream **this repository rendered itself** — not the
 * one DSpace generates upstream. `folio-assistant-core/scripts/gen-covers.ts` writes the
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

/** Why a rendered cover is withheld by its publication gates, or undefined when it is not (bean `cw35`). */
function coverWithheld(n: Node): string | undefined {
  const b = n.bitstreams?.find((x) => x.bundle === "THUMBNAIL");
  if (!b?.materialization?.localPath) return undefined;
  const blocked = publicationBlockers(b.materialization.gates);
  return blocked.length ? blocked.map((k) => `${k}: ${b.materialization?.gates?.[k]?.verdict ?? "not recorded"}`).join(", ") : undefined;
}

function coverSrc(n: Node): { src: string; w: number; h: number; masked: boolean } | undefined {
  const b = n.bitstreams?.find((x) => x.bundle === "THUMBNAIL");
  const lp = b?.materialization?.localPath;
  if (!b || !lp || b.pixelWidth === undefined || b.pixelHeight === undefined) return undefined;
  // Declared path honoured directly here, unlike `assetHref`: these bytes are
  // ones this repository wrote, at the path the node names, so a fallback
  // would be covering for a bug of our own making rather than for `yl5w`.
  const abs = join(INSTANCE, lp);
  if (!existsSync(abs)) return undefined;
  // A cover render reproduces the publication's own cover, so it is published
  // only when ITS gates permit it (bean `cw35`) — same rule as the PDF.
  if (publicationBlockers(b.materialization?.gates).length > 0) return undefined;
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
    src: encPath(relative(siteDir(), abs).split(sep).join("/")),
    w: b.pixelWidth,
    h: b.pixelHeight,
    // Read off the bitstream rather than assumed for every cover: a future
    // item whose cover carries no emblem needs no mask, and alt text claiming
    // one was removed would be describing a different image.
    masked: (b.maskedRegions ?? []).length > 0,
  };
}

// ── The replica's own words, and the languages it is shown in ─────────────
//
// Issue #2228, bean `lffo`. Owner, 2026-10-05: *"help make sure who-iris has
// all translations"*, and after measurement, the replica's INTERFACE in the
// five non-English UN languages.
//
// The model is `cat-harness/scripts/kg-viewer-strings.ts`, for the reason it
// gives: **a generated artefact is not a translation source; its generator
// is.** The pages are regenerated on every catalogue change, so a `.pot`
// extracted from them would churn its references with every run. The words
// are declared HERE, extracted by `--extract-pot` into
// `translations/<locale>/site/iris-site.pot` (the instance's declared
// `translation-sources` directory) and read back from each `.po`.
//
// **The msgid is the English text, not a key** — the gettext convention the
// platform follows everywhere. And `t()` refuses a string that is not in this
// table, so a page cannot say something no translator was asked about.
//
// ## Interface, not records
//
// Here: every word the REPLICA says — chrome, labels, headings, the banner,
// its own explanatory notes. NOT here: a publication's title, authors,
// abstract, citation, a collection's or community's name, a catalogue note, a
// bundle name, a gate's verdict. Those are the catalogue's DATA, and WHO
// publishes its own language versions of its works; a machine-translated
// title would misrepresent the record. Every translated page says so.
//
// Markup inside a msgid is deliberate: a sentence with a `<strong>` in it is
// one sentence, and splitting it at the tag would hand a translator three
// fragments whose order their language may need to change. A `{placeholder}`
// is substituted after translation and must survive it; `--check` enforces
// both that and that every tag a msgid carries survives too.

/** One string the replica says. */
interface UiString {
  /** The English text, which is also the gettext `msgid`. */
  readonly en: string;
  /** Where it appears and what each `{placeholder}` becomes — a `#.` comment in the POT. */
  readonly comment: string;
}

export const SITE_STRINGS: readonly UiString[] = [
  // ── Every page: head, banner, masthead, navbar, footer ──────────────────
  { en: "{title} — ingested IRIS replica", comment: "The browser tab title of every replica page. {title} is the page's own title (a collection or item name from the catalogue, which is not translated)." },
  { en: "A replica of a WHO IRIS page, rendered from this repository's ingested catalogue. Not WHO, and not live.", comment: "The page's meta description, read by search engines and link previews." },
  { en: "<strong>INGESTED COPY — not WHO, and not live.</strong> This page is rendered by {folioAssistant} from its own catalogue of {iris}, modelled <em>by reference</em>: {figures}. The WHO logo is deliberately omitted, and the rendered covers are withheld from display for the same reason — they carry the emblem printed on the publications.", comment: "The banner at the top of every page. {folioAssistant} and {iris} are links whose text is a name (folio-assistant, WHO IRIS) and is not translated. {figures} is the sentence about node counts below." },
  { en: "{nodes} nodes of a {items}-item {size} repository, of which <strong>{held} items</strong> are held here", comment: "Inside the banner. {nodes} is how many catalogue nodes exist here, {items} how many items IRIS holds upstream, {size} a size such as '361.55 GiB', {held} how many items are held here (2 or more)." },
  { en: "{nodes} nodes of a {items}-item {size} repository, of which <strong>1 item</strong> is held here", comment: "As above, when exactly one item is held here." },
  { en: "{nodes} nodes of a repository of unmeasured size, of which <strong>{held} item(s)</strong> are held here", comment: "As above, when the upstream size was never measured." },
  { en: "World Health<br>Organization", comment: "The wordmark in the masthead, set in type because the WHO logo is deliberately omitted. Use the Organization's official name in your language; the <br> breaks it over two lines and may move." },
  { en: "Institutional Repository<br>for Information Sharing", comment: "What the letters IRIS stand for, under the 'iris.' wordmark. Use the name WHO uses for IRIS in your language if there is one; the <br> may move." },
  { en: "Logo omitted, covers withheld — replica, not published under WHO", comment: "Small notice at the right of the masthead." },
  { en: "Communities &amp; Collections", comment: "Navbar link to the community list. DSpace's own label; keep &amp; as written if you use an ampersand." },
  { en: "Browse IRIS", comment: "Navbar item (shown, not a link, in the replica)." },
  { en: "Statistics", comment: "Navbar item (shown, not a link, in the replica)." },
  { en: "About", comment: "Navbar item (shown, not a link, in the replica)." },
  { en: "Contact", comment: "Navbar item (shown, not a link, in the replica)." },
  { en: "Help", comment: "Navbar item (shown, not a link, in the replica)." },
  { en: "Home", comment: "First breadcrumb, and the home page's own breadcrumb." },
  { en: "Community List", comment: "Breadcrumb on the community list page." },
  { en: "<strong>Ingested replica.</strong> Rendered from {catalogue} by {generator}. Layout after {iris}; every figure on this page is read out of the catalogue, not copied from a screenshot.", comment: "Footer, first paragraph. {catalogue} and {generator} are file paths in code type; {iris} is a link to iris.who.int. None are translated." },
  { en: "Source of record: {iris} — © WHO. This copy asserts no endorsement and carries no WHO mark.", comment: "Footer, second paragraph. {iris} is a link to iris.who.int." },
  { en: "Interface language", comment: "Accessible name of the row of language links in the banner. The links themselves are each language's own name and are not translated." },
  { en: "The interface is shown in {language}. Publication titles, authors, abstracts and other catalogue records are shown as WHO published them.", comment: "Shown on every translated page. {language} is the language's own name. It states where the translation stops: the records are WHO's data and are never machine-translated." },
  { en: "This interface translation was produced by an agent and has not been reviewed by a person.", comment: "Shown with the note above until a person signs the catalogue off." },

  // ── Materialisation states (a closed vocabulary the generator emits) ────
  { en: "materialized", comment: "State badge: the bytes are held in this repository. Shown in capitals by the stylesheet where the script has case." },
  { en: "referenced", comment: "State badge: known to the catalogue, held upstream at WHO only." },
  { en: "unknown", comment: "State badge: the catalogue has not determined the state." },

  // ── Table cells shared by several pages ─────────────────────────────────
  { en: "Item", comment: "Table column heading; also the badge on an item in the search results." },
  { en: "Collection", comment: "Table column heading; also the badge on a collection in the search results." },
  { en: "Community", comment: "The badge on a community in the search results." },
  { en: "State", comment: "Table column heading: the materialisation state." },
  { en: "Upstream", comment: "Table column heading: where the item lives at WHO." },
  { en: "Held copy", comment: "Table column heading: the copy held in this repository." },
  { en: "Metadata record", comment: "Table column heading: the item's Dublin Core record." },
  { en: "no collection recorded", comment: "In the Collection column when the catalogue names none." },
  { en: "in {communities}", comment: "Under a collection's name: the communities it sits in. {communities} is a list of names from the catalogue." },
  { en: "none captured", comment: "In the Metadata record column when no record was captured." },
  { en: "declared, but missing on disk", comment: "In the Metadata record column when the record is declared but its file is absent." },
  { en: "Download {file}", comment: "Link to download a metadata record. {file} is a file name." },
  { en: "via CDN", comment: "Second link to the same file, served by a content delivery network." },
  { en: "qualified Dublin Core · {size} KB", comment: "Under the download link: the record's format and size. {size} is a number." },
  { en: "no record, so nothing to render", comment: "In the Dublin Core renderings row when the item has no record." },
  { en: "this instance declares no published root", comment: "In the Dublin Core renderings row when there is nowhere to publish them." },
  { en: "{label}: not rendered (run {command})", comment: "A rendering that has not been produced. {label} is the rendering's name, {command} a command in code type." },
  { en: "Dublin Core XML", comment: "Link to the item's record as XML." },
  { en: "JSON-LD (DCMI Terms)", comment: "Link to the item's record as JSON-LD." },
  { en: "Local replica →", comment: "Link from a table row to this replica's page for the item. Flip the arrow if your language reads right to left." },
  { en: "IRIS source →", comment: "Link from a table row to the item's page at WHO. Flip the arrow if your language reads right to left." },
  { en: "no upstream URI recorded", comment: "In the Upstream column when the catalogue has no WHO address for the item." },
  { en: "held here, not published — {gates}", comment: "In place of a download link when a file is held but may not be published. {gates} names the publication gates that refused it, which are not translated." },
  { en: "not held here", comment: "In place of a download link when the file is not held in this repository." },
  { en: "not recorded", comment: "A file size the catalogue does not record." },
  { en: "{size} MB", comment: "A file size in megabytes. {size} is a number with two decimals." },

  // ── The community list ──────────────────────────────────────────────────
  { en: "List of Communities", comment: "Title and heading of the community list page, and a link to it from the home page." },
  { en: "{files} files · {size} upstream", comment: "Under a community: how many files it holds at WHO and their total size. {files} is a number, {size} a size such as '12.3 GiB'." },
  { en: "size upstream <strong>unknown</strong> — the storage report's second page was never read, and a number interpolated from the first would look measured", comment: "Under a community whose size at WHO was never measured." },
  { en: "{modelled} item(s) modelled, {held} held here", comment: "Beside a collection: how many of its items the catalogue models, and how many are held here. Both are numbers; rephrase freely to avoid plural agreement." },
  { en: "Every row below is <strong>live</strong>. A row is not greyed out when this repository does not hold it — it says {referenced} instead, which is the actual state and the whole point of a catalogue modelled by reference. {materialized} means the bytes are here.", comment: "Introduction to the community list. {referenced} and {materialized} are the state badges, already translated." },
  { en: "Held here — {n} materialized item(s)", comment: "Heading of the table of held items. {n} is a number." },
  { en: "Each row carries <strong>three routes to the same item</strong>: the <strong>IRIS source</strong> upstream at WHO, this repository's own <strong>local replica</strong> page, and the <strong>asset itself</strong> — downloadable from the repository and, separately, from a CDN edge.", comment: "Paragraph under that heading." },
  { en: "<strong>Three routes to one item, which is the point.</strong> The catalogue knows this item once; the bytes are reachable <em>upstream at WHO</em>, <em>here as a replica page</em>, and <em>from a CDN edge</em> — jsDelivr serves any public repository, so the last one costs this project no hosting at all. The KG says what exists and where; the CDN says nothing and just serves it.", comment: "Note under the held-items table. KG is 'knowledge graph'; jsDelivr is a product name." },
  { en: "<strong>Both link forms are confirmed working.</strong> The <code>raw.githubusercontent.com</code> links were fetched and returned 200 with byte counts matching the catalogue exactly. The <em>via CDN</em> links could not be checked from the environment that generated this page — <code>cdn.jsdelivr.net</code> is egress-blocked there — so they were composed from jsDelivr's documented URL form and the owner exercised one by hand on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds either unavailable still has the other.", comment: "Note under the held-items table. Keep everything in <code> as written." },
  { en: "<strong>Where the held copies actually live — bean <code>yl5w</code>.</strong> The catalogue records each of these at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three of those paths are missing</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>.", comment: "Note under the held-items table. A 'bean' is a work item in this repository's tracker; #477 is a pull request number. Keep everything in <code> as written." },
  { en: "The download links above point at where the bytes <em>are</em>, so they work. The claim in the catalogue is what is wrong, and <code>check:catalogue</code> does not check <code>localPath</code> at all — it verifies <code>metadataRef</code> and <code>libraryId</code>, and reports a clean run over three <code>materialized</code> claims that resolve to nothing.", comment: "Continues the note above. Keep everything in <code> as written: they are field and command names." },

  // ── A collection ────────────────────────────────────────────────────────
  { en: "Permanent URI for this collection", comment: "DSpace label before the collection's handle URL." },
  { en: "none recorded", comment: "In place of a URL or link the catalogue does not record." },
  { en: "<strong>How this node was established.</strong> {note}", comment: "Box above a collection's items. {note} is the catalogue's own note, which is not translated." },
  { en: "Items in this Collection", comment: "DSpace heading over a collection's item list." },
  { en: "Now showing 1 – {n} of {n} <em>modelled</em>. The upstream collection is larger; this catalogue holds what was materialised, and says so per row.", comment: "Under that heading. {n} is the number of items the catalogue models in this collection." },

  // ── An item ─────────────────────────────────────────────────────────────
  { en: "Permanent URI for this item", comment: "DSpace label before the item's handle URL." },
  { en: "none recorded — ingested from a local copy, not resolved from IRIS", comment: "In place of the item's URL when it has none." },
  { en: "In: {path}", comment: "Under the item's URL: the community and collection it sits in. {path} is names from the catalogue joined by ›." },
  { en: "Files", comment: "DSpace heading over the item's files." },
  { en: "Name", comment: "Table column heading: a file's name." },
  { en: "Bundle", comment: "Table column heading: the DSpace bundle a file belongs to (ORIGINAL, THUMBNAIL — those values are not translated)." },
  { en: "Size", comment: "Table column heading: a file's size." },
  { en: "Read it here", comment: "Heading over the embedded PDF reader." },
  { en: "Both links, as asked for", comment: "Heading over the table of the item's links: upstream at WHO and held here." },
  { en: "Where", comment: "Table column heading." },
  { en: "Link", comment: "Table column heading." },
  { en: "Upstream, at WHO", comment: "Row label: the item's address at WHO." },
  { en: "Held here, in folio-assistant", comment: "Row label: the copy held in this repository. folio-assistant is a name." },
  { en: "not held", comment: "In the row above when nothing is held." },
  { en: "In collection", comment: "Row label: the collection the item belongs to." },
  { en: "Ingested text (L1)", comment: "Row label: the item's text as extracted into this repository's library. L1 is a level name; keep it." },
  { en: "Dublin Core record", comment: "Row label: the item's metadata record." },
  { en: "Dublin Core renderings", comment: "Row label: the record rendered as XML and JSON-LD." },
  { en: "<strong>No Dublin Core record.</strong> The catalogue says so rather than synthesising metadata from the PDF — the <code>iris-dspace</code> skill's R8, <em>never infer metadata from the PDF when a record exists</em>, whose converse is that an absent record stays absent.", comment: "Shown on an item with no metadata record. iris-dspace is the name of a skill and R8 a rule number; keep both." },

  // ── The home page ───────────────────────────────────────────────────────
  { en: "The primary objective of the Institutional Repository for Information Sharing (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including contributions from its Country Offices, Regional Offices, and Headquarters. Additionally, IRIS encompasses the mandates established by the Organization’s Governing Bodies in collaboration with its Member States.", comment: "The hero paragraph on the home page, as IRIS's own home page states it. Use the Organization's official names for its offices and Governing Bodies in your language." },
  { en: "Replica. No WHO emblem, no photograph — colour only, from the {theme} theme measured off the site’s own stylesheet.", comment: "Small print under the hero paragraph. {theme} is a theme's name in code type." },
  { en: "Search through the repository’s {n} items", comment: "Placeholder text inside the search box. {n} is a number, written without separators." },
  { en: "Search through the repository items and referenced identifier lookup", comment: "Accessible name of the search box." },
  { en: "Search", comment: "The search button." },
  { en: "Search across <strong>{held}</strong> items held by value and referenced communities/collections. To look up any of the <strong>{referenced}</strong> referenced nodes by identifier, search here or open the {lookup}.", comment: "Note under the search box. {held} and {referenced} are numbers; {lookup} is a link whose text is the next string." },
  { en: "identifier lookup", comment: "Link text: the page that looks a node up by its identifier." },
  { en: "Upstream IRIS reports <strong>{items}</strong> items across <strong>{files}</strong> files.", comment: "Continues the note above. {items} and {files} are numbers." },
  { en: "Recent Submissions", comment: "DSpace heading on the home page." },
  { en: "Ordered by {key}, latest first — the key IRIS’s own list sorts on. Where a record carries several accessions the latest is used; the WPRO item has two, five days apart, the second being the regional-IRIS merge.", comment: "Under that heading. {key} is a metadata field name in code type. WPRO is the WHO Western Pacific Regional Office; keep the acronym." },
  { en: "Browse", comment: "Heading on the home page." },
  { en: "{link} — the replica of {url}, with every node’s materialisation state ({communities} communities, {collections} collections)", comment: "A list entry under Browse. {link} is the 'List of Communities' link, {url} an address in code type, {communities} and {collections} numbers." },
  { en: "{link} — collection", comment: "A list entry under Browse. {link} is a collection's name from the catalogue, which is not translated." },
  { en: "<strong>This is the front door, not the library visualiser.</strong> The full <code>library/</code> visualiser is bean <code>jbx2</code> and is being built separately. This page mocks the IRIS home page and links onward rather than becoming a second answer to the same question.", comment: "Note at the foot of the home page. A 'bean' is a work item; keep everything in <code> as written." },
  { en: "Addressing follows the owner’s rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so an instance that instantiates a directory gets a visualiser mounted under that directory’s kind: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, and so on.", comment: "Continues the note above. Keep everything in <code> as written." },
  { en: "no author recorded", comment: "In a recent submission's byline when the record names no author." },
  { en: "Publication Date: {date}", comment: "In a recent submission's byline, as IRIS labels it. {date} is a date such as 2020-05-14." },
  { en: "A cover is rendered and held here. It is not published: {gates}.", comment: "Tooltip on a withheld cover. {gates} names the publication gates that refused it, which are not translated." },
  { en: "cover<br>withheld", comment: "Placeholder in place of a withheld cover image, over two lines. The <br> may move." },
  { en: "no cover rendered", comment: "Tooltip on the placeholder of an item with no cover." },
  { en: "no cover", comment: "Placeholder in place of a cover that was never rendered." },
  { en: "Cover of {title}, rendered here from page 1 of the held PDF", comment: "Alternative text of a cover image, read by a screen reader. {title} is the publication's title, which is not translated." },
  { en: "Cover of {title}, rendered here from page 1 of the held PDF, with the WHO emblem masked out", comment: "As above, for a cover whose WHO emblem was masked." },
  { en: "A cover is rendered and recorded for this item. It is not displayed: the publication's cover carries the WHO emblem, and this replica is not published under WHO.", comment: "Tooltip on a cover the replica chooses not to display." },
  { en: "No <code>dc.description.abstract</code> in the captured record.", comment: "In place of an abstract the record does not carry. Keep the field name in <code> as written." },

  // ── The search box's results, drawn in the browser ─────────────────────
  { en: "Matching catalogue nodes ({n}):", comment: "Heading of the search results. {n} is a number." },
  { en: "Also search identifier lookup:", comment: "Before a link that repeats the search in the identifier lookup." },
  { en: "Look up “{q}” in referenced nodes →", comment: "That link. {q} is what the reader typed. Use your language's quotation marks; flip the arrow for right-to-left." },
  { en: "No materialized items or collections matched “<strong>{q}</strong>”.", comment: "When nothing matches. {q} is what the reader typed." },
  { en: "Search for “{q}” in the referenced identifier lookup ({n} nodes) →", comment: "Link shown when nothing matches. {q} is what the reader typed, {n} a number. Flip the arrow for right-to-left." },
];

const SITE_TABLE = new Map(SITE_STRINGS.map((s) => [s.en, s]));

/**
 * The six UN languages in the order the docs locale globe draws them
 * (`UN_LOCALES` in `docs-ui.js`), so the `fa-translation-meta` block a page
 * carries reads the same as every other page's.
 */
const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "zh", "en", "fr", "ru", "es"];

/** Each language's name in its own language: a reader looking for 中文 is not looking for "Chinese". */
const LOCALE_NAMES: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  es: "Español",
  fr: "Français",
  ru: "Русский",
  zh: "中文",
};

/** The gettext catalogue's name, under `<translations>/<locale>/site/`. */
const SITE_CATALOGUE = "iris-site";
const SITE_CATALOGUE_DIR = "site";

/** The declared `translation-sources` directory — never a spelled path. */
function translationsDir(): string {
  const entry = readDeclaration(INSTANCE)?.directories?.find((d) =>
    (d.graphTypologies ?? []).includes("translation-sources"),
  );
  if (entry === undefined) {
    throw new Error("gen-iris-pages: who-iris declares no `translation-sources` directory, so there is nowhere to read the replica's translations from.");
  }
  return join(INSTANCE, entry.path);
}

const catalogueFile = (locale: string, ext: "po" | "pot"): string =>
  join(translationsDir(), locale, SITE_CATALOGUE_DIR, `${SITE_CATALOGUE}.${ext}`);

const CATALOGUES = new Map<string, Map<string, string>>();
function catalogueFor(locale: string): Map<string, string> {
  let m = CATALOGUES.get(locale);
  if (m === undefined) {
    const f = catalogueFile(locale, "po");
    m = existsSync(f) ? parsePo(readFileSync(f, "utf-8")) : new Map();
    CATALOGUES.set(locale, m);
  }
  return m;
}

/** The language the page being rendered is in. Set per page set by `main`. */
let LOCALE: Locale = "en";

/**
 * A string in the current page's language, with its placeholders filled.
 *
 * Falls back to the English per string, so a missing translation renders as
 * English rather than as nothing — and `--check` reports the gap. `vars` are
 * substituted AFTER translation and must already be escaped: the msgid is
 * trusted markup from this table, a value is not.
 */
function t(en: string, vars: Record<string, string | number> = {}): string {
  if (!SITE_TABLE.has(en)) {
    throw new Error(`gen-iris-pages: "${en.slice(0, 60)}" is not in SITE_STRINGS, so no translator was ever asked about it. Add it there.`);
  }
  let s = LOCALE === "en" ? en : catalogueFor(LOCALE).get(en) || en;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** A number in the current page's language, in Latin digits (as WHO's own Arabic pages print them). */
function num(n: number, decimals?: number): string {
  const fixed = decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  return n.toLocaleString(LOCALE === "en" ? "en-US" : `${LOCALE}-u-nu-latn`, fixed);
}

/** The directory the current page set is written to. */
const siteDir = (): string => (LOCALE === "en" ? SITE : join(SITE, LOCALE));
/** What a current page prefixes to reach the replica's root. */
const toSiteRoot = (): string => (LOCALE === "en" ? "" : "../");

/** Every `{placeholder}` a string carries, sorted. */
function placeholdersOf(s: string): string[] {
  return [...s.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((m) => m[1]!).sort();
}

/** Every element a string opens or closes, sorted — a translation must keep the same markup. */
function tagsOf(s: string): string[] {
  return [...s.matchAll(/<\/?([a-zA-Z]+)/g)].map((m) => m[0]!.toLowerCase()).sort();
}

/** The table as POT entries, each pointing at the line of this file that declares it. */
export function sitePotEntries(): PotEntry[] {
  const source = readFileSync(import.meta.path, "utf-8").split("\n");
  return SITE_STRINGS.map((s) => {
    const needle = `en: ${JSON.stringify(s.en)}`;
    const i = source.findIndex((l) => l.includes(needle));
    return {
      source: "who-iris/scripts/gen-iris-pages.ts",
      line: i + 1,
      msgid: s.en,
      kind: "ui-string",
      comment: s.comment,
    };
  });
}

/**
 * Drift between the table and the catalogues: a stale template, a translation
 * of a string the replica no longer says, a dropped placeholder or tag, an
 * empty or fuzzy entry. Coverage below 100 % is drift here, not a note: the
 * owner asked for every page in every language, and a gap would render as
 * English inside a page that says it is translated.
 */
export function catalogueProblems(): { problems: string[]; notes: string[] } {
  const problems: string[] = [];
  const notes: string[] = [];
  for (const loc of SITE_LOCALES) {
    const pot = catalogueFile(loc, "pot");
    const po = catalogueFile(loc, "po");
    if (!existsSync(pot)) problems.push(`${loc}: no ${SITE_CATALOGUE}.pot — run with --extract-pot`);
    else {
      const ids = new Set(parsePoEntries(readFileSync(pot, "utf-8")).map((e) => e.msgid));
      const missing = SITE_STRINGS.filter((s) => !ids.has(s.en)).length;
      const extra = [...ids].filter((id) => !SITE_TABLE.has(id)).length;
      if (missing || extra) problems.push(`${loc}: ${SITE_CATALOGUE}.pot is stale — ${missing} string(s) missing, ${extra} no longer said. Run with --extract-pot.`);
    }
    if (!existsSync(po)) {
      problems.push(`${loc}: no ${SITE_CATALOGUE}.po`);
      continue;
    }
    const entries = parsePoEntries(readFileSync(po, "utf-8"));
    const byId = new Map(entries.map((e) => [e.msgid, e]));
    let done = 0;
    for (const e of entries) {
      if (!SITE_TABLE.has(e.msgid)) problems.push(`${loc}: translates a string the replica no longer says — "${e.msgid.slice(0, 48)}…"`);
    }
    for (const s of SITE_STRINGS) {
      const e = byId.get(s.en);
      if (e === undefined || e.msgstr === "") {
        problems.push(`${loc}: untranslated — "${s.en.slice(0, 48)}…"`);
        continue;
      }
      if (e.flags.includes("fuzzy")) problems.push(`${loc}: fuzzy — "${s.en.slice(0, 48)}…"`);
      if (placeholdersOf(s.en).join() !== placeholdersOf(e.msgstr).join()) {
        problems.push(`${loc}: placeholders differ — "${s.en.slice(0, 40)}…" has {${placeholdersOf(s.en).join(",")}}, the translation {${placeholdersOf(e.msgstr).join(",")}}`);
      }
      if (tagsOf(s.en).join() !== tagsOf(e.msgstr).join()) {
        problems.push(`${loc}: markup differs — "${s.en.slice(0, 40)}…" has [${tagsOf(s.en).join(" ")}], the translation [${tagsOf(e.msgstr).join(" ")}]`);
      }
      done++;
    }
    notes.push(`${loc}: ${done}/${SITE_STRINGS.length} — ${LOCALE_NAMES[loc]}`);
  }
  return { problems, notes };
}

/** Write each locale's `.pot` from the table. The `.po` beside it is a translator's, and is never touched. */
function extractPot(): void {
  const entries = sitePotEntries();
  for (const loc of SITE_LOCALES) {
    const f = catalogueFile(loc, "pot");
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, formatPot(entries, { projectName: `who-iris ${SITE_CATALOGUE}`, locale: loc }));
    console.log(`  ${relative(REPO_ROOT, f)}`);
  }
  console.log(`${entries.length} string(s) extracted for ${SITE_LOCALES.join(", ")}.`);
}

/** The same replica page in another language, relative to the current one. */
function hrefIn(target: Locale, file: string): string {
  return `${toSiteRoot()}${target === "en" ? "" : `${target}/`}${file}`;
}

/**
 * What a replica page puts in its `<head>` to say which language it is in and
 * where its other languages are.
 *
 * The `fa-translation-meta` block is the docs pages' own (`_includes/
 * head_custom.html`), carried here because a mounted page is never laid out
 * by Jekyll: `docs-ui.js` reads it to draw the locale globe, and
 * `set-html-lang.ts` to stamp the served `<html lang>`. Every locale is
 * AVAILABLE here — the globe greys out a locale with no page, and the
 * replica has a page in all six (issue #2219 drew the globe with five of them
 * greyed out, because until now there were none). The layout it links to,
 * `<dir>/<locale>/<page>`, is `localePath` in `docs-ui.js`, so the globe and
 * the links below agree without either knowing about the other.
 */
function localeHead(file: string): string {
  const meta = {
    lang: LOCALE,
    translationStatus: LOCALE === "en" ? "" : "unverified",
    translationSource: LOCALE === "en" ? "" : `who-iris/site/${file}`,
    supportedLocales: SUPPORTED_LOCALES,
    availableLocales: SUPPORTED_LOCALES,
  };
  const alternates = SUPPORTED_LOCALES.map(
    (loc) => `\n<link rel="alternate" hreflang="${loc}" href="${esc(hrefIn(loc, file))}">`,
  ).join("");
  return `${alternates}\n<script type="application/json" id="fa-translation-meta">${JSON.stringify(meta)}</script>`;
}

/**
 * The row of language links in the banner, and — on a translated page —
 * where the translation stops.
 *
 * Each language is named in its own language and marked with its own `lang`,
 * so a screen reader pronounces 中文 as Chinese inside an English page.
 */
function localeBar(file: string): string {
  const links = SUPPORTED_LOCALES.map((loc) =>
    loc === LOCALE
      ? `<span lang="${loc}" aria-current="page">${LOCALE_NAMES[loc]}</span>`
      : `<a href="${esc(hrefIn(loc, file))}" lang="${loc}" hreflang="${loc}">${LOCALE_NAMES[loc]}</a>`,
  ).join("");
  const note =
    LOCALE === "en"
      ? ""
      : `\n  <p class="langnote">${t("The interface is shown in {language}. Publication titles, authors, abstracts and other catalogue records are shown as WHO published them.", { language: LOCALE_NAMES[LOCALE] })}
  ${t("This interface translation was produced by an agent and has not been reviewed by a person.")}</p>`;
  return `\n  <nav class="langs" aria-label="${esc(t("Interface language"))}">${links}</nav>${note}`;
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
const BANNER = new Map<Locale, string>();
function banner(): string {
  const memo = BANNER.get(LOCALE);
  if (memo !== undefined) return memo;
  const all = nodes();
  const held = all.filter((n) => n.flavour === "item" && assetHref(n) !== undefined).length;
  const c = catalogue();
  const figures =
    c.totalBytesUpstream === undefined || c.totalItemsUpstream === undefined
      ? t("{nodes} nodes of a repository of unmeasured size, of which <strong>{held} item(s)</strong> are held here", { nodes: num(all.length), held: num(held) })
      : held === 1
        ? t("{nodes} nodes of a {items}-item {size} repository, of which <strong>1 item</strong> is held here", { nodes: num(all.length), items: num(c.totalItemsUpstream), size: gb(c.totalBytesUpstream) })
        : t("{nodes} nodes of a {items}-item {size} repository, of which <strong>{held} items</strong> are held here", { nodes: num(all.length), items: num(c.totalItemsUpstream), size: gb(c.totalBytesUpstream), held: num(held) });
  BANNER.set(LOCALE, figures);
  return figures;
}

/**
 * The pattern that finds the SITE ROOT from one of these pages' own URLs, and
 * the folio mount built from it.
 *
 * F8/F9, bean `jpjt`. Owner: *"who-iris, smart-* etc are content libraries a
 * user is browsing and their 'folio' from the cat-harness is consistent
 * across them."* The reader carries their folio into the library; the library
 * does not implement one. `board-windows` puts the test plainly — *"the test
 * is not 'is this folio good' but 'is this the same folio'"* — so the page
 * loads the platform's own stylesheet and script and there is no second
 * implementation here to drift.
 *
 * **The pattern lives in this file and not in the platform**, because it is a
 * statement about THIS instance's routes: `who-iris/site/` is served at
 * `/who-iris/` and `who-iris/docs/` at `/docs/who-iris/`, exactly as the
 * comment below records. A platform module that knew that would be the
 * platform knowing about one library.
 *
 * Both mounts, and the two bases this site is actually served under:
 *
 * | URL | site root |
 * |---|---|
 * | `/who-iris/item-x.html` | `/` |
 * | `/docs/who-iris/ingestion-notes.html` | `/` |
 * | `/folio-assistant/who-iris/item-x.html` | `/folio-assistant/` |
 * | `/STAGING/<branch>/who-iris/item-x.html` | `/STAGING/<branch>/` |
 *
 * That last row is why this is derived in the browser rather than written as
 * an absolute URL: a baked site URL is correct on exactly one of those four.
 */
const FOLIO_ROUTE = /^(.*?)(?:docs\/)?who-iris\//;
/**
 * The folio mount, emitted on who-iris's OWN pages and withheld on the
 * `harness` side. The withholding is measured, not stylistic.
 *
 * `FOLIO_ROUTE` is `^(.*?)(?:docs\/)?who-iris\/`, which MATCHES
 * `/cat-harness/catalogue/who-iris/` — the route the catalogue viewer moved to
 * for bean `ha78` — and derives the site root as `/cat-harness/catalogue/`.
 * The mount would then request its two assets from a path that 404s. A script
 * that matches the WRONG thing is worse than one that does not match at all:
 * it runs, it fails, and it looks installed.
 *
 * Widening the pattern is not the repair either. The mount exists so a reader
 * browsing WHO-IRIS carries their folio (#796, F8/F9); a kind viewer published
 * under cat-harness's handler is on cat-harness's site, which has its own
 * chrome. Matching it would put who-iris's furniture on a cat-harness route.
 *
 * #879's own gate agrees by construction: who-iris declares
 * `folioMount.roots` as `["site/", "docs/"]`, and the viewer is under
 * neither, so nothing asks that page for the marker.
 */
const FOLIO_MOUNT = folioMountFragment(FOLIO_ROUTE);

/**
 * One replica page.
 *
 * `side` is not decoration: the two sides are MOUNTED AT DIFFERENT ROUTES —
 * `who-iris/site/` at `/who-iris/` and `who-iris/docs/` at
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
  crumbs: { label: string; href?: string; record?: { lang?: string } }[],
  body: string,
  /**
   * WHICH SITE THIS PAGE IS ON, which is now three answers rather than two.
   *
   * `site` and `docs` are who-iris's own tree, mounted under its routes.
   * `harness` is a kind viewer published into cat-harness's site at
   * `/<handler>/<kind>/<subject>/` — a different site, with its own chrome.
   */
  side: "site" | "docs" | "harness",
  /**
   * The graph typologies this page documents, as `<meta name="documents">` — the
   * page names what it is about, so the directory need not name the page
   * (#1168 B7c). Only the docs index carries one.
   */
  documents: readonly string[] = [],
  /**
   * The page's file name within the replica, for a page built in every
   * language: it is what the language links, the `hreflang` alternates and the
   * `fa-translation-meta` block are made from. Absent on the docs and harness
   * sides, which are English only and carry none of the three.
   */
  file?: string,
): string {
  /* A CRUMB WITH NO HREF IS A LABEL, never `<a href="#">`.
   *
   * The fallback used to be `#`, which was harmless while every non-final
   * crumb carried an href — and stopped being harmless the moment one did
   * not. Moving the catalogue viewer to the conventional route (bean `ha78`)
   * dropped its "Documentation" href, because the docs index is on a mount
   * route and no relative path reaches it from here. The crumb then rendered
   * as `<a href="#">who-iris</a>`: focusable, styled as a link, announced as
   * a link, and doing nothing.
   *
   * That is the defect the href was dropped to AVOID, reintroduced by the
   * template one layer down. Verified by rendering the page rather than by
   * reading the call site, which is what `gjli` is about — the generator's
   * input looked right and its output did not.
   */
  const crumbHtml = crumbs
    .map((c, i) =>
      i === crumbs.length - 1 || c.href === undefined
        ? `<span class="here">${crumbLabel(c)}</span>`
        : `<a href="${esc(c.href)}">${crumbLabel(c)}</a>`,
    )
    .join('<span class="sep">•</span>');

  const dir = LOCALE === "ar" ? ' dir="rtl"' : "";
  return `<!DOCTYPE html>
<html lang="${LOCALE}"${dir}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t("{title} — ingested IRIS replica", { title }))}</title>${documents.length ? `\n<meta name="documents" content="${esc(documents.join(" "))}">` : ""}
<meta name="description" content="${esc(t("A replica of a WHO IRIS page, rendered from this repository's ingested catalogue. Not WHO, and not live."))}">${file === undefined ? "" : localeHead(file)}
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
  /* A long path in inline code has no break opportunity, and at a 390 px
     viewport three of them made kg-to-portal 566 px wide (bean xwrt). These
     pages are mounted verbatim, so the harness's narrow-viewport.css never
     reaches them. Breaking the string beats widening the page. */
  :not(pre) > code { overflow-wrap: anywhere; }
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
  /* The language row and, on a translated page, where its translation stops. */
  .ingested .langs { margin: 0.45rem 0 0; display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; font-size: 0.9rem; }
  .ingested .langs [aria-current] { font-weight: 700; }
  .ingested .langnote { margin: 0.45rem 0 0; font-size: 0.88rem; }

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
    margin-inline-start: auto; font-size: 0.78rem; color: var(--iris-muted);
    text-align: end; max-width: 16rem;
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
  .note { color: var(--iris-muted); font-size: 0.95rem; margin: 0.2rem 0 0; margin-inline-start: 1.9rem; }
  .kids { margin: 0.35rem 0 0.5rem; margin-inline-start: 1.9rem; padding: 0; list-style: none; }
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
  .kg th, .kg td { text-align: start; padding: .4rem .55rem; border-bottom: 1px solid var(--iris-edge); vertical-align: top; }
  .kg th { font-weight: 600; white-space: nowrap; }
  .dim { opacity: .65; font-size: .85em; }

  table.items { width: 100%; border-collapse: collapse; margin-top: 0.8rem; font-size: 0.97rem; }
  table.items th, table.items td {
    text-align: start; padding: 0.7rem 0.6rem; border-bottom: 1px solid var(--iris-edge);
    vertical-align: top;
  }
  table.items th { font-weight: 700; background: var(--iris-wash); }
  /* Six columns on the held-items table; without a floor the title and
     collection cells wrap to one word per line. */
  table.items td:first-child, table.items th:first-child { min-width: 13rem; }
  table.items td:nth-child(2) { min-width: 9rem; }
  table.items code { font-size: 0.86rem; color: var(--iris-muted); }
  /* Wraps at EVERY width (bean on the 2026-09-30 QA re-run): nowrap held the
     "Metadata record" column to its longest file name, so collection pages ran
     1338-1475px wide at 1280 and 1162-1405px at 1024. #1592 fixed this only
     below 640px. A long file name breaks inside the link; the short
     format/size label stays on one line. */
  .dl { white-space: normal; }
  .dl a { overflow-wrap: anywhere; }
  .dl code { white-space: nowrap; }

  /* ── IRIS home replica ────────────────────────────────────────────────
     Bands in the capture's order: hero, search, Recent Submissions. Measured
     against who-iris/uploads/iris-home/iris-capture/IRIS-Home.pdf page 1.

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
    border: 1px solid var(--iris-edge); border-inline-end: none;
    border-radius: 0; border-start-start-radius: 4px; border-end-start-radius: 4px;
    background: #fff; color: var(--iris-ink);
  }
  .searchbar button {
    padding: 0.7rem 1.4rem; font-size: 1rem; font-family: inherit; font-weight: 600;
    border: 1px solid var(--iris-accent);
    border-radius: 0; border-start-end-radius: 4px; border-end-end-radius: 4px;
    background: var(--iris-accent); color: #fff; cursor: pointer;
  }
  .searchbar button:hover, .searchbar button:focus {
    background: var(--iris-dark);
  }
  .search-results-panel {
    margin: 1rem 0 1.5rem;
    border: 1px solid var(--iris-edge);
    border-radius: 4px;
    background: var(--iris-surface);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 1rem;
  }
  .search-results-panel h3 {
    margin: 0 0 0.8rem;
    font-size: 1.05rem;
    color: var(--iris-dark);
  }
  .search-results-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .search-result-item {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--iris-edge);
    border-radius: 4px;
    background: var(--iris-wash);
  }
  .search-result-item a {
    font-weight: 600;
    font-size: 1.02rem;
  }
  .search-result-meta {
    font-size: 0.88rem;
    color: var(--iris-muted);
    margin-top: 0.25rem;
  }
  .search-result-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.15rem 0.45rem;
    border-radius: 3px;
    background: var(--iris-accent);
    color: #fff;
    margin-inline-end: 0.5rem;
  }
  .search-remote-box {
    border-top: 1px solid var(--iris-edge);
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.92rem;
  }
  mark.search-mark {
    background: #ffeb3b;
    color: inherit;
    padding: 0 2px;
    border-radius: 2px;
  }
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
    text-align: start; padding: 0.65rem 0.7rem; border-bottom: 1px solid var(--iris-edge);
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
    border-inline-start: 4px solid var(--iris-current); background: var(--iris-wash);
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
    /* The download-cell wrap that g9r2 put here (537 px wide at 390) now
       applies at every width, in the \`.dl\` rule above: desktop overflowed
       the same way, one column wider. */
    table.items tr { border-bottom: 1px solid var(--iris-edge); padding: 0.7rem 0; }
    table.reqs, table.reqs tbody, table.reqs tr, table.reqs td, table.reqs th { display: block; width: auto; }
    table.reqs thead { display: none; }
    table.reqs td, table.reqs th.rid { border-bottom: none; padding: 0.2rem 0; }
    table.reqs tr { border-bottom: 1px solid var(--iris-edge); padding: 0.7rem 0; }
    .hero h1 { font-size: 2.6rem; }
    .searchbar { flex-direction: column; }
    .searchbar input { border-inline-end: 1px solid var(--iris-edge); border-radius: 4px 4px 0 0; }
    .searchbar button { border-radius: 0 0 4px 4px; }
    .sub { flex-direction: column; }
  }
</style>
</head>
<body>

<div class="ingested"><div class="wrap">
  ${t("<strong>INGESTED COPY — not WHO, and not live.</strong> This page is rendered by {folioAssistant} from its own catalogue of {iris}, modelled <em>by reference</em>: {figures}. The WHO logo is deliberately omitted, and the rendered covers are withheld from display for the same reason — they carry the emblem printed on the publications.", {
    folioAssistant: `<a href="https://github.com/litlfred/folio-assistant">folio-assistant</a>`,
    iris: `<a href="https://iris.who.int/">WHO IRIS</a>`,
    figures: banner(),
  })}${file === undefined ? "" : localeBar(file)}
</div></div>

<header class="mast"><div class="wrap">
  <div class="wordmark">
    <span class="org">${t("World Health<br>Organization")}</span>
    <span class="bar"></span>
    <span class="stack">
      <span class="iris">iris<span class="dot">.</span></span>
      <span class="sub">${t("Institutional Repository<br>for Information Sharing")}</span>
    </span>
  </div>
  <div class="nologo">${t("Logo omitted, covers withheld — replica, not published under WHO")}</div>
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
  ${side === "site"
    ? `<a href="community-list.html">${t("Communities &amp; Collections")}</a>`
    : `<span>${t("Communities &amp; Collections")}</span>`}
  <span>${t("Browse IRIS")}</span><span>${t("Statistics")}</span><span>${t("About")}</span><span>${t("Contact")}</span><span>${t("Help")}</span>
</div></nav>

<div class="crumbs"><div class="wrap">${crumbHtml}</div></div>

<main class="wrap">
${body}
</main>

<footer class="mast"><div class="wrap">
  <p>${t("<strong>Ingested replica.</strong> Rendered from {catalogue} by {generator}. Layout after {iris}; every figure on this page is read out of the catalogue, not copied from a screenshot.", {
    catalogue: "<code>who-iris/catalogue/</code>",
    generator: "<code>who-iris/scripts/gen-iris-pages.ts</code>",
    iris: `<a href="https://iris.who.int/community-list">iris.who.int</a>`,
  })}</p>
  <div class="rule"></div>
  <p>${t("Source of record: {iris} — © WHO. This copy asserts no endorsement and carries no WHO mark.", {
    iris: `<a href="https://iris.who.int/">iris.who.int</a>`,
  })}</p>
</div></footer>
${side === "harness" ? "" : FOLIO_MOUNT}
</body>
</html>
`;
}

function stateBadge(state: string): string {
  // The three states are a closed vocabulary the generator itself emits, so
  // their WORDS are interface and are translated; the class keeps the value,
  // so the colour does not depend on the language. A state outside the three
  // is the catalogue's data and is shown as written.
  const word = state === "materialized" || state === "referenced" || state === "unknown" ? t(state) : esc(state);
  return `<span class="state ${esc(state)}">${word}</span>`;
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

/**
 * A "held as" library id, linked the way every library reference is (bean
 * `qgjh`, `lib/library-links.ts`): the library viewer opened on the item, the
 * item's page and its source, each only where it resolves. The viewer link is
 * made relative to this page. An id nothing resolves stays code.
 */
function heldAs(id: string): string {
  const l = LIBRARY_LINKS.links(id, SUBJECT);
  const code = `<code>${esc(id)}</code>`;
  if (l === undefined) return code;
  const from = subjectPage(HANDLER, CATALOGUE_KIND, SUBJECT).replace(/^\/|\/$/g, "");
  const parts = [l.viewer === undefined ? code : (() => {
    const [path, hash] = l.viewer!.split("#");
    return `<a href="${esc(`${posix.relative(from, path!)}/#${hash}`)}">${code}</a>`;
  })()];
  if (l.readme !== undefined) parts.push(`<a href="${esc(l.readme)}">item page</a>`);
  if (l.source !== undefined) parts.push(`<a href="${esc(l.source)}">source</a>`);
  return parts.join(" &middot; ");
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
      const held = n.libraryId ? heldAs(n.libraryId) : "—";
      const rec = n.metadataRef ? "yes" : "—";
      const bs = (n.bitstreams ?? []).length;
      return `<tr>
  <td>${stateBadge(state)}</td>
  <td><code>${esc(n.flavour ?? n.kind ?? "?")}</code></td>
  <td>${replicaPageOf(n) ? `<a href="${esc(`${REPLICA_FROM_CATALOGUE}/${replicaPageOf(n)}`)}">${esc(n.title)}</a>` : esc(n.title)}<br><code class="dim">${esc(n.id)}</code></td>
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
          ? t("{files} files · {size} upstream", { files: num(c.childCountUpstream), size: gb(m.collectionBytes) })
          : t("size upstream <strong>unknown</strong> — the storage report's second page was never read, and a number interpolated from the first would look measured");

      const kids = kidCollections.length
        ? `<ul class="kids">${kidCollections
            .map((k) => {
              const inIt = items.filter((i) => i.parents.some((p) => p.includes(k.id)));
              const held = inIt.filter((i) => assetHref(i)).length;
              return `<li><a href="collection-${esc(slug(k.id))}.html">${data(k.title)}</a>
                ${stateBadge(k.materialization?.state ?? "unknown")}
                <span class="note" style="margin:0;margin-inline-start:.4rem;display:inline">${t("{modelled} item(s) modelled, {held} held here", { modelled: num(inIt.length), held: num(held) })}</span></li>`;
            })
            .join("\n")}</ul>`
        : "";

      return `<li>
  <div class="row"><span class="chev" aria-hidden="true">&rsaquo;</span>
    <span class="title"><a href="${esc(m?.provenance?.upstream ?? "https://iris.who.int/")}">${data(c.title)}</a>
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
  <td><a href="item-${esc(slug(n.id))}.html">${data(n.title, langOf(n))}</a><br>
      <code>${esc(n.libraryId ?? n.id)}</code></td>
  <td>${collectionCell(n, all)}</td>
  <td>${stateBadge("materialized")}</td>
  <td class="dl">${upstreamCell(n)}</td>
  <td class="dl">${linkOrWithheld(a!, true)}</td>
  <td class="dl">${metadataCell(n)}</td>
</tr>`,
    )
    .join("\n");

  return `<h1>${t("List of Communities")}</h1>

<p>${t("Every row below is <strong>live</strong>. A row is not greyed out when this repository does not hold it — it says {referenced} instead, which is the actual state and the whole point of a catalogue modelled by reference. {materialized} means the bytes are here.", {
    referenced: stateBadge("referenced"),
    materialized: stateBadge("materialized"),
  })}</p>

<ul class="communities">
${rows}
</ul>

<h2>${t("Held here — {n} materialized item(s)", { n: num(held.length) })}</h2>
<p>${t("Each row carries <strong>three routes to the same item</strong>: the <strong>IRIS source</strong> upstream at WHO, this repository's own <strong>local replica</strong> page, and the <strong>asset itself</strong> — downloadable from the repository and, separately, from a CDN edge.")}</p>

<table class="items">
<thead><tr><th>${t("Item")}</th><th>${t("Collection")}</th><th>${t("State")}</th><th>${t("Upstream")}</th><th>${t("Held copy")}</th><th>${t("Metadata record")}</th></tr></thead>
<tbody>
${table}
</tbody>
</table>

<div class="caveat">
  <p>${t("<strong>Three routes to one item, which is the point.</strong> The catalogue knows this item once; the bytes are reachable <em>upstream at WHO</em>, <em>here as a replica page</em>, and <em>from a CDN edge</em> — jsDelivr serves any public repository, so the last one costs this project no hosting at all. The KG says what exists and where; the CDN says nothing and just serves it.")}</p>
  <p>${t("<strong>Both link forms are confirmed working.</strong> The <code>raw.githubusercontent.com</code> links were fetched and returned 200 with byte counts matching the catalogue exactly. The <em>via CDN</em> links could not be checked from the environment that generated this page — <code>cdn.jsdelivr.net</code> is egress-blocked there — so they were composed from jsDelivr's documented URL form and the owner exercised one by hand on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds either unavailable still has the other.")}</p>
  <p>${t("<strong>Where the held copies actually live — bean <code>yl5w</code>.</strong> The catalogue records each of these at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three of those paths are missing</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>.")}</p>
  <p>${t("The download links above point at where the bytes <em>are</em>, so they work. The claim in the catalogue is what is wrong, and <code>check:catalogue</code> does not check <code>localPath</code> at all — it verifies <code>metadataRef</code> and <code>libraryId</code>, and reports a clean run over three <code>materialized</code> claims that resolve to nothing.")}</p>
</div>
`;
}

function slug(id: string): string {
  return id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

/**
 * The replica page this run writes for a node, or `undefined` for a flavour
 * that has none. ONE answer for the writer below and for the catalogue page's
 * links (bean `qgjh`), so a link cannot name a page nobody wrote.
 */
function replicaPageOf(n: Node): string | undefined {
  if (n.flavour === "collection") return `collection-${slug(n.id)}.html`;
  if (n.flavour === "item") return `item-${slug(n.id)}.html`;
  return undefined;
}

/**
 * The catalogue page's way to the replica, relative (bean `qgjh`).
 *
 * The replica is the INSTANCE ROOT, and since bean `2b5s` that is the only
 * route it answers at: `site/` shares the `docs` kind with `docs/`, and
 * `withRoutes` gives the kind route to the sibling that is not the instance
 * root. It used to link the kind route `library/who-iris`, which is now a
 * redirect to the library viewer — a link that would land on a different page
 * from the one it names. So the route is ASKED of `withRoutes`, fed from the
 * declaration, rather than spelled: the declaration says which directory is
 * the root, and `withRoutes` says where that puts it. Relative, so it holds
 * under the bare site, the project baseurl and a staging preview alike.
 */
const LIBRARY_LINKS = libraryResolver(repoRootFor(HARNESS_ROOT), HARNESS_ROOT);

/** The replica's route from the site root (no slashes), as `withRoutes` gives it. */
const REPLICA_ROUTE = (() => {
  const declared = (readDeclaration(INSTANCE)?.directories ?? []).flatMap((d) =>
    (d.graphTypologies ?? []).map((kind) => ({ name: SUBJECT, kind, dir: d.path, instanceRoot: (d as { instanceRoot?: boolean }).instanceRoot === true })),
  );
  const { candidates } = withRoutes(declared);
  const root = candidates.find((c) => c.instanceRoot && c.route === SUBJECT);
  if (root === undefined) {
    throw new Error(
      "who-iris.json marks no directory `instanceRoot`, so the replica has no route for the " +
        "catalogue page to link. Mark the replica's directory, or this link is a guess.",
    );
  }
  return root.route;
})();

/* Relative from the catalogue page, built on the one route above, which the
   withheld list also uses (issue #1794) — two consumers, one route. */
const REPLICA_FROM_CATALOGUE = posix.relative(
  subjectPage(HANDLER, CATALOGUE_KIND, SUBJECT).replace(/^\/|\/$/g, ""),
  REPLICA_ROUTE,
);

/**
 * The item's upstream URI, or undefined when it has none.
 *
 * **Undefined is the common case and it must survive to the page.** Two of the
 * three held items record no IRIS handle at all — they were ingested from a
 * PDF somebody had, not resolved from IRIS — and an earlier version of this
 * function fell back to `https://iris.who.int/`, so every row rendered a
 * confident "IRIS source →" and one third of them went to the front page. A
 * link that resolves is not the same as a link that is true.
 *
 * ## It no longer guesses from the scheme
 *
 * This asked `of?.startsWith("http")`, because `of` held upstream URIs and
 * local references in one field and the scheme was the only thing telling them
 * apart. That proxy worked by luck: a local reference that happened to be an
 * `http` URL would have rendered as an IRIS source, and an upstream one under
 * any other scheme would have vanished. `provenance.upstream` answers the
 * question the function is actually asking, so the heuristic is gone.
 */
function sourceOf(n: Node): string | undefined {
  // Bean `08u4`: the Handle IRI first (it outlives the host), the host URL
  // second, never the front page — one definition, in the schema.
  return resolvableIri(n);
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
    return `<span class="none">${t("no collection recorded")}</span>`;
  }
  return collections
    .map(
      (c) =>
        `<a href="collection-${esc(slug(c.id))}.html">${data(c.title)}</a>` +
        (containers.filter((x) => x.flavour === "community").length
          ? `<br><code>${t("in {communities}", { communities: data(containers.filter((x) => x.flavour === "community").map((x) => x.title).join(" / ")) })}</code>`
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
  if (!n.metadataRef) return `<span class="none">${t("none captured")}</span>`;
  const abs = join(INSTANCE, n.metadataRef);
  if (!existsSync(abs)) return `<span class="none">${t("declared, but missing on disk")}</span>`;
  const rel = encPath(`who-iris/${n.metadataRef}`);
  const bytes = readFileSync(abs, "utf-8").length;
  return `<a href="${esc(`${RAW}/${rel}`)}">${t("Download {file}", { file: data(n.metadataRef.split("/").pop()!) })}</a>
      <br><a class="cdn" href="${esc(`${CDN}/${rel}`)}">${t("via CDN")}</a>
      <br><code>${t("qualified Dublin Core · {size} KB", { size: num(bytes / 1024, 1) })}</code>`;
}

/**
 * The record's two standard renderings — DC XML and DCMI-Terms JSON-LD —
 * written by `dc-render.ts` beside these pages (bean `7eak`, owner:
 * *"who-iris should link to json and xml renderings"*).
 *
 * The path comes from `dcRenderingsFor`, the same function the renderer
 * writes with, so the link and the file cannot name two places. A file that
 * is not there is NOT linked: a link to a rendering nobody wrote reads exactly
 * like one that works. `dc:render:check` is what makes "not there" a failure.
 */
function renderingsCell(n: Node): string {
  if (!n.metadataRef) return `<span class="none">${t("no record, so nothing to render")}</span>`;
  const r = dcRenderingsFor(INSTANCE, n.metadataRef);
  if (r === undefined) return `<span class="none">${t("this instance declares no published root")}</span>`;
  const link = (abs: string, label: string): string =>
    existsSync(abs)
      ? `<a href="${esc(encPath(relative(siteDir(), abs).split(sep).join("/")))}">${label}</a>`
      : `<span class="none">${t("{label}: not rendered (run {command})", { label, command: "<code>bun run dc:render</code>" })}</span>`;
  return `${link(r.xml, t("Dublin Core XML"))}
      <br>${link(r.jsonld, t("JSON-LD (DCMI Terms)"))}`;
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
  const replica = `<a href="item-${esc(slug(n.id))}.html">${t("Local replica →")}</a>`;
  if (u) return `<a href="${esc(u)}">${t("IRIS source →")}</a><br>${replica}`;
  // The LOCAL original, now asked for by name. This read `of` — the same field
  // `sourceOf` had just rejected — so it showed whatever was left over rather
  // than the local reference it claims to show.
  const local = n.bitstreams?.find((b) => b.materialization?.provenance?.local)?.materialization
    ?.provenance?.local;
  return `<span class="none">${t("no upstream URI recorded")}</span>${
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
  <td><a href="item-${esc(slug(n.id))}.html">${data(n.title, langOf(n))}</a><br><code>${esc(n.libraryId ?? n.id)}</code></td>
  <td>${stateBadge(a ? "materialized" : (n.materialization?.state ?? "unknown"))}</td>
  <td class="dl">${upstreamCell(n)}</td>
  <td class="dl">${a ? linkOrWithheld(a, true) : t("not held here")}</td>
  <td class="dl">${metadataCell(n)}</td>
</tr>`;
    })
    .join("\n");

  return `<h1${dataBlock()}>${esc(c.title)}</h1>
<p>${t("Permanent URI for this collection")}
  ${c.materialization?.provenance?.upstream ? `<a href="${esc(c.materialization.provenance.upstream)}">${data(c.materialization.provenance.upstream)}</a>` : `<span class="none">${t("none recorded")}</span>`}
  ${stateBadge(c.materialization?.state ?? "unknown")}</p>

${c.materialization?.note ? `<div class="caveat"><p>${t("<strong>How this node was established.</strong> {note}", { note: `<bdi${langAttr(NOTE_LANG)}>${withInlineCode(c.materialization.note, esc)}</bdi>` })}</p></div>` : ""}

<h2>${t("Items in this Collection")}</h2>
<p>${t("Now showing 1 – {n} of {n} <em>modelled</em>. The upstream collection is larger; this catalogue holds what was materialised, and says so per row.", { n: num(items.length) })}</p>

<table class="items">
<thead><tr><th>${t("Item")}</th><th>${t("State")}</th><th>${t("Upstream")}</th><th>${t("Held copy")}</th><th>${t("Metadata record")}</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
`;
}

/**
 * The held PDF, readable in place — or nothing (bean `folio-assistant-5ea6`).
 *
 * Gated by the SAME decision as the download link: {@link linkOrWithheld}
 * refuses to link bytes whose publication gates block, and an embedded viewer
 * is a link that also renders. So a withheld item gets no viewer, and its page
 * says nothing more than the "held here, not published" the Files row already
 * says. Only PDFs: the viewer is pdf.js, and a held `.docx` in a PDF frame is
 * an error page.
 *
 * The CDN URL rather than the raw one, for the reason the page already offers
 * it — it is the one that serves the bytes with a cache in front.
 * `FOLIO_ROUTE` finds the site root for the same reason it does for the folio
 * mount: one page, several depths.
 */
function readHere(n: Node, a: ReturnType<typeof assetHref>): string {
  if (!a || a.withheld.length > 0 || !/\.pdf$/i.test(a.name)) return "";
  return `<h2>${t("Read it here")}</h2>
${pdfViewer({ src: a.cdn, title: n.title, route: FOLIO_ROUTE })}

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

  return `<h1${dataBlock(langOf(n))}>${esc(n.title)}</h1>
<p>${t("Permanent URI for this item")}
  ${sourceOf(n) ? `<a href="${esc(sourceOf(n)!)}">${data(sourceOf(n)!)}</a>` : `<span class="none">${t("none recorded — ingested from a local copy, not resolved from IRIS")}</span>`}
  ${stateBadge(a ? "materialized" : (n.materialization?.state ?? "unknown"))}</p>

${named.length ? `<p class="note" style="margin-inline-start:0">${t("In: {path}", { path: named.map((p) => data(p.title)).join(" &rsaquo; ") })}</p>` : ""}

<h2>${t("Files")}</h2>
<table class="items">
<thead><tr><th>${t("Name")}</th><th>${t("Bundle")}</th><th>${t("Size")}</th><th>${t("State")}</th></tr></thead>
<tbody>
${bits}
</tbody>
</table>

${readHere(n, a)}<h3>${t("Both links, as asked for")}</h3>
<table class="items">
<thead><tr><th>${t("Where")}</th><th>${t("Link")}</th></tr></thead>
<tbody>
<tr><td>${t("Upstream, at WHO")}</td><td>${sourceOf(n) ? `<a href="${esc(sourceOf(n)!)}">${data(sourceOf(n)!)}</a>` : t("none recorded")}</td></tr>
<tr><td>${t("Held here, in folio-assistant")}</td>
    <td>${a ? linkOrWithheld(a, false) : t("not held")}</td></tr>
<tr><td>${t("In collection")}</td><td>${collectionCell(n, all)}</td></tr>
<tr><td>${t("Ingested text (L1)")}</td>
    <td>${n.libraryId ? `<a href="https://github.com/litlfred/folio-assistant/tree/main/who-iris/library/${esc(n.libraryId)}/sections">who-iris/library/${esc(n.libraryId)}/sections/</a>` : "—"}</td></tr>
<tr><td>${t("Dublin Core record")}</td><td>${metadataCell(n)}</td></tr>
<tr><td>${t("Dublin Core renderings")}</td><td>${renderingsCell(n)}</td></tr>
</tbody>
</table>

${
  hasDc
    ? ""
    : `<div class="caveat"><p>${t("<strong>No Dublin Core record.</strong> The catalogue says so rather than synthesising metadata from the PDF — the <code>iris-dspace</code> skill's R8, <em>never infer metadata from the PDF when a record exists</em>, whose converse is that an absent record stays absent.")}</p></div>`
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
 * Validated against `who-iris/uploads/iris-home/iris-capture/IRIS-Home.pdf`,
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
 * ## Search across held items and referenced identifier lookup
 *
 * The placeholder reads `Search through the repository's 273559 items`,
 * transcribed from the capture, because that is the sentence IRIS shows and it
 * is where this repository's item count came from at all. The form actively
 * searches across the held catalogue items, collections and communities, and
 * links onward to the prefix-sharded identifier lookup for referenced nodes
 * (`id-lookup`).
 */
function landingPage(all: Node[]): string {
  const items = all.filter((n) => n.flavour === "item");
  const communities = all.filter((n) => n.flavour === "community");
  const collections = all.filter((n) => n.flavour === "collection");
  const held = items.filter((n) => assetHref(n) !== undefined);
  const cat = catalogue();
  // The nodes held by REFERENCE: every node but the items held by value. This
  // was the literal 10 until 2026-10-05, true when it was typed; counted now,
  // so the sentence stays true when the catalogue grows.
  const REFERENCED_NODES = all.length - held.length;

  const submissions = recentOrder(items).map((n) => submission(n)).join("\n");

  const itemsUpstream = cat.totalItemsUpstream;
  const filesUpstream = cat.totalFilesUpstream;

  const searchEntries = all
    .map((n) => {
      if (n.flavour === "item") {
        const authors = dc(n, "contributor", "author");
        const issued = day(dc(n, "date", "issued")[0]);
        const abstract = dc(n, "description", "abstract")[0] ?? "";
        const cite = dc(n, "identifier", "citation")[0] ?? dc(n, "identifier", "govdoc")[0] ?? "";
        const meta = [authors.join("; "), cite, issued].filter(Boolean).join(" · ");
        const text = [n.title, n.id, n.libraryId ?? "", authors.join(" "), cite, issued, abstract].join(" ").toLowerCase();
        return {
          title: n.title,
          href: `item-${slug(n.id)}.html`,
          badge: t("Item"),
          meta,
          lang: langOf(n) !== LOCALE ? langOf(n) : undefined,
          abstract: abstract.slice(0, 240),
          text,
        };
      }
      if (n.flavour === "collection") {
        return {
          title: n.title,
          href: `collection-${slug(n.id)}.html`,
          badge: t("Collection"),
          meta: n.id,
          abstract: n.materialization?.note ?? "",
          text: [n.title, n.id, n.materialization?.note ?? ""].join(" ").toLowerCase(),
        };
      }
      return {
        title: n.title,
        href: "community-list.html",
        badge: t("Community"),
        meta: n.id,
        abstract: "",
        text: [n.title, n.id].join(" ").toLowerCase(),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "en"));

  return `
<section class="hero">
  <div class="hero-in">
    <h1>IRIS</h1>
    <p>${t("The primary objective of the Institutional Repository for Information Sharing (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including contributions from its Country Offices, Regional Offices, and Headquarters. Additionally, IRIS encompasses the mandates established by the Organization’s Governing Bodies in collaboration with its Member States.")}</p>
  </div>
  <p class="hero-note">${t("Replica. No WHO emblem, no photograph — colour only, from the {theme} theme measured off the site’s own stylesheet.", { theme: "<code>iris-web</code>" })}</p>
</section>

<form class="searchbar" id="iris-search-form" action="${toSiteRoot()}../id-lookup/" method="get">
  <input type="hidden" name="index" value="who-iris/">
  <input type="text" id="iris-search-input" name="q"
    placeholder="${esc(t("Search through the repository’s {n} items", { n: itemsUpstream !== undefined ? String(itemsUpstream) : "?" }))}"
    aria-label="${esc(t("Search through the repository items and referenced identifier lookup"))}"
    autocomplete="off" spellcheck="false">
  <button type="submit" id="iris-search-btn">${t("Search")}</button>
</form>
<div id="iris-search-results" class="search-results-panel" role="region" aria-live="polite" style="display:none"></div>
<p class="searchnote" id="iris-search-note">${t("Search across <strong>{held}</strong> items held by value and referenced communities/collections. To look up any of the <strong>{referenced}</strong> referenced nodes by identifier, search here or open the {lookup}.", {
    held: num(held.length),
    referenced: num(REFERENCED_NODES),
    lookup: `<a href="${toSiteRoot()}../id-lookup/?index=who-iris/">${t("identifier lookup")}</a>`,
  })}${itemsUpstream !== undefined && filesUpstream !== undefined
    ? `\n${t("Upstream IRIS reports <strong>{items}</strong> items across <strong>{files}</strong> files.", { items: num(itemsUpstream), files: num(filesUpstream) })}`
    : ""}</p>

<h2>${t("Recent Submissions")}</h2>
<p class="ordering">${t("Ordered by {key}, latest first — the key IRIS’s own list sorts on. Where a record carries several accessions the latest is used; the WPRO item has two, five days apart, the second being the regional-IRIS merge.", { key: "<code>dc.date.accessioned</code>" })}</p>

<div class="subs">
${submissions}
</div>

<h2>${t("Browse")}</h2>
<ul class="kids" style="margin-inline-start:0">
  <li>${t("{link} — the replica of {url}, with every node’s materialisation state ({communities} communities, {collections} collections)", {
    link: `<a href="community-list.html">${t("List of Communities")}</a>`,
    url: "<code>iris.who.int/community-list</code>",
    communities: num(communities.length),
    collections: num(collections.length),
  })}</li>
${collections
  .map((c) => `  <li>${t("{link} — collection", { link: `<a href="collection-${esc(slug(c.id))}.html">${data(c.title)}</a>` })}</li>`)
  .join("\n")}
</ul>

<div class="caveat">
  <p>${t("<strong>This is the front door, not the library visualiser.</strong> The full <code>library/</code> visualiser is bean <code>jbx2</code> and is being built separately. This page mocks the IRIS home page and links onward rather than becoming a second answer to the same question.")}</p>
  <p>${t("Addressing follows the owner’s rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so an instance that instantiates a directory gets a visualiser mounted under that directory’s kind: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, and so on.")}</p>
</div>

<script>
(function() {
  var index = ${JSON.stringify(searchEntries)};
  var T = ${JSON.stringify({
    matching: t("Matching catalogue nodes ({n}):"),
    also: t("Also search identifier lookup:"),
    lookUp: t("Look up “{q}” in referenced nodes →"),
    none: t("No materialized items or collections matched “<strong>{q}</strong>”."),
    searchFor: t("Search for “{q}” in the referenced identifier lookup ({n} nodes) →", { n: num(REFERENCED_NODES) }),
  })};
  function fill(s, q, n) { return s.split("{q}").join(q).split("{n}").join(n); }
  var form = document.getElementById("iris-search-form");
  var input = document.getElementById("iris-search-input");
  var results = document.getElementById("iris-search-results");
  if (!form || !input || !results) return;

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function highlight(text, terms) {
    if (!terms.length) return escapeHtml(text);
    var escaped = escapeHtml(text);
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (!t) continue;
      var regex = new RegExp("(" + t.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&") + ")", "gi");
      escaped = escaped.replace(regex, "<mark class=\\"search-mark\\">$1</mark>");
    }
    return escaped;
  }

  function update() {
    var raw = input.value.trim();
    if (!raw) {
      results.style.display = "none";
      results.replaceChildren();
      return;
    }
    var terms = raw.toLowerCase().split(/\\s+/).filter(Boolean);
    var matches = [];
    for (var i = 0; i < index.length; i++) {
      var entry = index[i];
      var ok = true;
      for (var t = 0; t < terms.length; t++) {
        if (entry.text.indexOf(terms[t]) < 0) {
          ok = false;
          break;
        }
      }
      if (ok) matches.push(entry);
    }

    var lookupUrl = "${toSiteRoot()}../id-lookup/?index=who-iris/&q=" + encodeURIComponent(raw);
    var html = "";

    if (matches.length > 0) {
      html += "<h3 style=\\"margin:0 0 0.8rem;font-size:1.05rem;color:var(--iris-dark);\\">" + fill(T.matching, "", String(matches.length)) + "</h3>";
      html += "<ul class=\\"search-results-list\\" style=\\"list-style:none;padding:0;margin:0 0 1rem;display:flex;flex-direction:column;gap:0.75rem;\\">";
      for (var m = 0; m < matches.length; m++) {
        var it = matches[m];
        // The record's own language, where it differs from the page's (bean lffo).
        var la = it.lang ? " lang=\\"" + it.lang + "\\"" : "";
        html += "<li class=\\"search-result-item\\" style=\\"padding:0.6rem 0.8rem;border:1px solid var(--iris-edge);border-radius:4px;background:var(--iris-wash);\\">";
        html += "<div><span class=\\"search-result-badge\\" style=\\"display:inline-block;font-size:0.75rem;font-weight:600;text-transform:uppercase;padding:0.15rem 0.45rem;border-radius:3px;background:var(--iris-accent);color:#fff;margin-inline-end:0.5rem;\\">" + escapeHtml(it.badge) + "</span>";
        html += "<a href=\\"" + it.href + "\\" dir=\\"auto\\"" + la + " style=\\"font-weight:600;font-size:1.02rem;\\">" + highlight(it.title, terms) + "</a></div>";
        if (it.meta) {
          html += "<div class=\\"search-result-meta\\" dir=\\"auto\\"" + la + " style=\\"font-size:0.88rem;color:var(--iris-muted);margin-top:0.25rem;\\">" + highlight(it.meta, terms) + "</div>";
        }
        if (it.abstract) {
          var snip = it.abstract.length > 180 ? it.abstract.slice(0, 180) + "…" : it.abstract;
          html += "<div class=\\"search-result-meta\\" dir=\\"auto\\"" + la + " style=\\"font-size:0.88rem;color:var(--iris-ink);margin-top:0.35rem;\\">" + highlight(snip, terms) + "</div>";
        }
        html += "</li>";
      }
      html += "</ul>";
      html += "<div class=\\"search-remote-box\\" style=\\"border-top:1px solid var(--iris-edge);padding-top:0.75rem;margin-top:0.75rem;font-size:0.92rem;\\">";
      html += T.also + " <a href=\\"" + lookupUrl + "\\" class=\\"search-remote-link\\">" + fill(T.lookUp, escapeHtml(raw), "") + "</a>";
      html += "</div>";
    } else {
      html += "<p style=\\"margin:0 0 0.5rem;\\">" + fill(T.none, escapeHtml(raw), "") + "</p>";
      html += "<div class=\\"search-remote-box\\" style=\\"border-top:1px solid var(--iris-edge);padding-top:0.75rem;margin-top:0.75rem;font-size:0.92rem;\\">";
      html += "<a href=\\"" + lookupUrl + "\\" class=\\"search-remote-link\\" style=\\"font-weight:600;\\">" + fill(T.searchFor, escapeHtml(raw), "") + "</a>";
      html += "</div>";
    }

    results.innerHTML = html;
    results.style.display = "block";
  }

  input.addEventListener("input", update);
  form.addEventListener("submit", function(e) {
    var raw = input.value.trim();
    if (!raw) { e.preventDefault(); return; }
    var hasLocal = results.querySelector(".search-result-item");
    var firstLink = results.querySelector(".search-result-item a");
    if (hasLocal && firstLink) {
      e.preventDefault();
      firstLink.focus();
    }
  });

  var urlParams = new URLSearchParams(window.location.search);
  var initQ = urlParams.get("q");
  if (initQ) {
    input.value = initQ;
    update();
  }
})();
</script>
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
  const lang = langOf(n);

  const byline = [
    authors.length ? data(authors.join("; "), lang) : `<span class="none">${t("no author recorded")}</span>`,
    `(${[cite ? data(cite, lang) : undefined, issued ? t("Publication Date: {date}", { date: data(issued) }) : undefined]
      .filter(Boolean)
      .join(", ")})`,
  ].join(" ");

  // Three states, not two. A withheld cover and an absent one look the same
  // in a layout and mean opposite things about the catalogue.
  const withheldBy = coverWithheld(n);
  const coverCell = withheldBy
    ? `<span class="nocover" title="${esc(t("A cover is rendered and held here. It is not published: {gates}.", { gates: withheldBy }))}">${t("cover<br>withheld")}</span>`
    : !cov
    ? `<span class="nocover" title="${esc(t("no cover rendered"))}">${t("no cover")}</span>`
    : COVERS_SHOWN
      ? `<a href="item-${esc(slug(n.id))}.html"><img src="${esc(cov.src)}" width="${cov.w}" height="${cov.h}"
        alt="${esc(cov.masked
          ? t("Cover of {title}, rendered here from page 1 of the held PDF, with the WHO emblem masked out", { title: n.title })
          : t("Cover of {title}, rendered here from page 1 of the held PDF", { title: n.title }))}" loading="lazy"></a>`
      : `<span class="nocover" title="${esc(t("A cover is rendered and recorded for this item. It is not displayed: the publication's cover carries the WHO emblem, and this replica is not published under WHO."))}">${t("cover<br>withheld")}</span>`;

  return `<article class="sub">
  <div class="sub-cover">${coverCell}</div>
  <div class="sub-body">
    <a class="sub-title"${dataBlock(lang)} href="item-${esc(slug(n.id))}.html">${esc(n.title)}</a>
    <p class="sub-by">${byline}</p>
    ${
      abstract
        ? `<p class="sub-abs"${dataBlock(lang)}>${esc(abstract)}</p>`
        : `<p class="sub-abs none">${t("No <code>dc.description.abstract</code> in the captured record.")}</p>`
    }
    <p class="sub-links">${
      a
        ? linkOrWithheld(a, true)
        : `<span class="none">${t("not held here")}</span>`
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
  // BOTH sides, since the 2026-09-21 split: the replica is site-side and
  // the documentation is docs-side, and "how many pages does this instance
  // ship" is a question about the instance rather than about one directory.
  const htmlIn = (dir: string): number =>
    existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".html")).length : 0;
  const pages = htmlIn(SITE) + htmlIn(DOCS);
  // The covers the replica SHOWS — which are exactly the covers the mount
  // publishes, since bean `2b5s` publishes a page's embedded assets and not
  // the directory they sit in. This counted `docs/assets/covers/`, a
  // directory the covers left in `yl5w`, so it reported 0 over three.
  const covers = all.filter((n) => coverSrc(n) !== undefined).length;

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

<h2>Publishing a large graph: skeleton, payloads, one SQLite file per slice</h2>

<p>A corpus the size of IRIS can only be searched on the client if the client never
downloads the whole graph. The platform&rsquo;s answer is <strong>late
materialization</strong>. The graph is published as three things:</p>

<ol class="kids" style="margin-left:0">
  <li><strong>The skeleton, as JSON-LD.</strong> Each named subgraph &mdash; a directory of a
      declared graph &mdash; is published at <code>/subgraph/&lt;harness&gt;/&lt;path&gt;/</code> as
      <code>index.jsonld</code> (pointers to its members and child subgraphs) and
      <code>index.hydrated.jsonld</code> (every member inline, with metadata only). The root
      has the pointer file only, so no single file is ever the whole graph.</li>
  <li><strong>Payloads, by content address.</strong> Heavy content &mdash; a body, a PDF, a page
      of sections &mdash; lives at <code>/payload/sha256/&lt;hex&gt;</code>, named by the hash of its
      bytes, with a <code>&lt;hex&gt;.json</code> sidecar giving its media type. A node carries a
      <code>payload</code> link with <code>sha256</code> and <code>bytes</code>, so a consumer can
      decide whether to fetch before it fetches.</li>
  <li><strong>Per-slice SQLite.</strong> CI flattens one slice into a relational schema:
      one table per node type, one table per relation, and a contentless FTS5 index. It
      publishes the result as <code>&lt;slice&gt;.&lt;sha256&gt;.sqlite3</code>, named by the
      hash of its bytes, with a <code>&lt;slice&gt;.sqlite3.json</code> manifest at a fixed path
      beside it that names the file. A row holds only the payload
      pointer, never the payload. The browser downloads the file, checks its sha256 against the
      manifest, imports it into the Origin Private File System, and opens it with the official
      SQLite WASM build. Nothing is parsed.</li>
</ol>

<p>The contract is in the <code>kg-export</code> skill, under &ldquo;Named subgraphs&rdquo;,
&ldquo;Payloads&rdquo; and &ldquo;Per-slice SQLite&rdquo;. The procedure is the
<code>slice-sqlite-publish</code> process. This page does not restate that contract&rsquo;s
rules; where the two differ, the skill is right.</p>

<h3>Measured: the four pilots</h3>

<p class="ordering">These are the platform&rsquo;s own slices, not this catalogue&rsquo;s. They
were measured on 2026-10-03 (bean <code>q8ar</code>). The first open was measured in Chromium
on loopback against a plain static server with no COOP/COEP headers, and includes the download
and the sha256 check.</p>

<table class="reqs">
  <thead><tr><th>slice</th><th>file</th><th>source as published</th><th>first open</th></tr></thead>
  <tbody>
    <tr><th class="rid">beans</th><td>2.83 MB</td><td>4.82 MB of bean files</td><td>~190 ms</td></tr>
    <tr><th class="rid">todos</th><td>0.07 MB</td><td>18 KB of JSON</td><td>~110 ms</td></tr>
    <tr><th class="rid">library</th><td>2.48 MB</td><td>3.59 MB of JSON</td><td>~165 ms</td></tr>
    <tr><th class="rid">kg</th><td>3.40 MB</td><td>3.03 MB of JSON-LD (the whole-repo graph, without bodies)</td><td>~180 ms</td></tr>
  </tbody>
</table>

<p>The VFS is <code>opfs-sahpool</code>, running in a Worker. It needs neither
SharedArrayBuffer nor COOP/COEP, which GitHub Pages cannot send. Reopening from OPFS took about
85&nbsp;ms, with no download. Without a Worker or OPFS, the verified bytes are opened in memory
instead, and the page reports which mode it used.</p>

<div class="caveat">
  <p><strong>No who-iris slice is built, and none of these numbers is a who-iris
  number.</strong> Nothing here was measured against a CDN, either: <code>cdn.jsdelivr.net</code>
  is egress-blocked from the container that generates this page.</p>
</div>

<h3>The slice budget, and what to do above it</h3>

<p><strong>As built:</strong> the budget is about 5&nbsp;MB per file
(<code>SIZE_BUDGET_BYTES</code>). It is reported in the manifest as <code>overBudget</code>
and is not gated. The process says what to do over budget: try the no-body variant first, then
stop and report the measurement. All four pilots are under it.</p>

<p><strong>Why IRIS will not fit one slice.</strong> This is arithmetic on the pilots, not a
measurement. The pilots hold between ${(3.40 * 1024 / 3121).toFixed(1)}&nbsp;KB per node
(<code>kg</code>, 3,121 nodes) and ${(2.83 * 1024 / 723).toFixed(1)}&nbsp;KB per row
(<code>beans</code>, 723 rows). At those rates, ${cat.totalItemsUpstream ? `the ${cat.totalItemsUpstream.toLocaleString("en-US")} upstream items would make one file of roughly ${Math.round(cat.totalItemsUpstream * 3.40 / 3121)} to ${Math.round(cat.totalItemsUpstream * 2.83 / 723)}&nbsp;MB, before any per-bitstream row. That is about ${Math.round(cat.totalItemsUpstream * 3.40 / 3121 / 5)} to ${Math.round(cat.totalItemsUpstream * 2.83 / 723 / 5)} times the budget.`: "no size can be estimated, because the upstream item count is unknown."}</p>

<p><strong>Recommended, not built: split by subgraph.</strong> A slice is one
<code>SliceDef</code>, and nothing in the builder requires a slice to be a whole graph. A
DSpace community or collection is already a directory-shaped subgraph, so the natural cut is
one slice per community or collection. If one of those is still over budget, split it at the
next level down. Do not split by row count: a slice should match a subgraph IRI a reader can
name. Each split slice keeps the full contract, with its own manifest, row digest and
determinism check. A small <strong>routing slice</strong> would let one search span all of IRIS.
It would hold only titles, identifiers and the subgraph each item belongs to, so the client can
then open the one slice that has the rows. That is the skeleton pattern again, one level up.</p>

<h3>CDN caching</h3>

<table class="reqs">
  <thead><tr><th>file</th><th>as built</th><th>recommended behind a CDN</th></tr></thead>
  <tbody>
    <tr><th class="rid">payload</th><td>named by its sha256, so its bytes never change</td><td class="why">cache forever (<code>immutable</code>); a new body is a new URL</td></tr>
    <tr><th class="rid">subgraph JSON-LD</th><td>a stable IRI whose content changes when the graph does</td><td class="why">short TTL; a long one serves an old skeleton whose payload links may have been removed as orphans since</td></tr>
    <tr><th class="rid">slice manifest</th><td><code>&lt;slice&gt;.sqlite3.json</code> at a <strong>fixed</strong> path; it names the slice file; the client fetches it with <code>no-store</code></td><td class="why">short TTL or none; it is the one file that says which build is current</td></tr>
    <tr><th class="rid">slice file</th><td><code>&lt;slice&gt;.&lt;sha256&gt;.sqlite3</code>, named by its sha256, so its bytes never change; OPFS keys its copy by the same sha256</td><td class="why">cache forever (<code>immutable</code>); a new build is a new URL</td></tr>
  </tbody>
</table>

<div class="caveat">
  <p><strong>This section has been corrected twice.</strong> It first said that only the
  manifest needs a short TTL, because the client keys its copy by sha256. That held for the
  browser&rsquo;s OPFS copy, not for a CDN: the slice file was then published at the same path
  every build, so a CDN could serve old bytes against a new manifest, the client would refuse
  them on the sha256 check, and search was down until the cache expired. That is now fixed
  (bean <code>wixl</code>). The slice file is published at
  <code>assets/slices/&lt;slice&gt;.&lt;sha256&gt;.sqlite3</code>, and the manifest&rsquo;s
  <code>file</code> names it. A fresh manifest names a file no cache has seen. A stale one names
  an older file that still matches it.</p>
  <p><strong>Why not under <code>/payload/sha256/</code>:</strong> a payload is a node&rsquo;s
  body, linked from that node and removed once nothing links to it. A slice file is linked from
  no node, so the payload tree would treat it as an orphan. It takes the payload rule that
  matters, immutable bytes at a hash-named address, without joining that tree.</p>
  <p><strong>What a CDN can still hold, as built:</strong> for one manifest TTL, a stale
  manifest together with the older file it names, which is a consistent pair. It can also hold
  an older file that nothing names until that file expires, or a stale manifest whose file the
  origin has stopped serving. The page reports that last case as a 404 and asks for a reload. A
  manifest that names a file with a different sha256 is <strong>refused</strong> with a visible
  message, never opened. Each deploy writes only the current file. Old ones do not pile up on
  the host. GitHub Pages sends <code>max-age=600</code> for every file and cannot be told to send
  anything else, so on Pages the manifest&rsquo;s short TTL is ten minutes.</p>
</div>

<p>No CDN layer has been chosen (bean <code>l9v6</code>, still <em>proposed</em>). Whichever
one is chosen stands <em>in front of</em> the publication host, as above. The slice files and
payloads go out through the same publish-to-CDN step as every other page (bean
<code>7dek</code>, <code>Process_RenderKgToCdn</code>), behind the same four gates (bean
<code>xies</code>). The URL-layout check that <code>xies</code> asks for must therefore cover
<code>/payload/sha256/</code> and <code>assets/slices/</code> too.</p>

<h3>How a client picks a slice</h3>

<p><strong>As built:</strong> <code>assets/slices/index.json</code>
(<code>folio-slice-index/v1</code>) lists every slice built into the site. The one search page,
<code>slices/search.html?slice=&lt;name&gt;</code>, lists them when no slice is named. Given a
name, it reads everything else it needs from the <code>search</code> block of that
slice&rsquo;s manifest. The reader picks. The page checks the name against a pattern before
using it in a path.</p>

<p><strong>Recommended for who-iris, not built:</strong> keep the reader&rsquo;s choice, and
make the choices follow the catalogue&rsquo;s community and collection tree. A reader browsing
a community opens that community&rsquo;s slice, named in its <code>index.jsonld</code>. A
reader searching all of IRIS opens the routing slice first. Several slices can be open at once,
because each is its own file in the pool. What that costs on a phone has not been
measured.</p>

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
catalogue itself is served by the library handler, and the replica rendered
from it is this instance&rsquo;s own front page.</p>

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
  if (process.argv.includes("--extract-pot")) {
    extractPot();
    return 0;
  }
  const all = nodes();
  const files = new Map<string, string>();
  /**
   * Pages written OUTSIDE who-iris, keyed by absolute path.
   *
   * A separate map rather than a third key prefix on `files`, for the reason
   * the comment on `LIB`/`DOCS` already gives: the key carries the side, and
   * nothing infers a destination from a filename. A prefix would be an
   * inference, and one that has to be kept in step with the OWNED patterns.
   */
  const siteFiles = new Map<string, string>();

  // KEYED BY SIDE, not by name. Both sides need an `index.html` — the replica
  // needs one because it is a site, and the docs side needs one because
  // `mount-instance-docs.ts` will not mount a directory without it — so a map
  // keyed on the bare name can hold only one of them.

  files.set(
    "docs/index.html",
    page("who-iris — documentation", [{ label: "Documentation" }], docsIndex(), "docs", ["catalogue"]),
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

  /* THE CATALOGUE VIEWER IS NOT A DOCS PAGE, and moving it settles which.
   *
   * It was `docs/catalogue.html` until 2026-09-22 (bean `ha78`, issue #886):
   * built, declared, resolving — and linked by nothing, because a ref inside a
   * mounted tree is not one `harnessTiles` can strip a site prefix off. Its own
   * declaration already argued it is "the KG view, NOT the replica", so the
   * docs side was the wrong side for it on the declaration's own terms.
   *
   * THE BREADCRUMB LOSES ITS HREF, deliberately. It was
   * `{ href: "index.html" }` — sibling-relative, which resolved to who-iris's
   * docs index while the page sat beside it and resolves to THIS PAGE from the
   * new route. There is no safe replacement: the docs index lives on a mount
   * route, and a site-root-relative link is wrong under a baseurl and wrong
   * again under `/STAGING/<branch>/`. Inventing one here would be guessing at
   * the cross-route problem #879 is solving properly; a crumb that reads as a
   * link and returns you to where you already are is worse than a plain label.
   */
  siteFiles.set(
    CATALOGUE_VIEWER,
    page(
      "The catalogue, as a graph",
      [{ label: "who-iris" }, { label: "Catalogue" }],
      cataloguePage(all),
      "harness",
    ),
  );

  // THE REPLICA, ONCE PER LANGUAGE (issue #2228). English first and at the
  // top level, where it always was; then each translation beneath
  // `site/<locale>/`. The docs and harness pages above are English only and
  // were rendered before the first switch, which is the only reason the
  // module-level LOCALE is safe here: nothing renders across the loop.
  for (const locale of ["en", ...SITE_LOCALES] as Locale[]) {
    LOCALE = locale;
    const at = locale === "en" ? "site" : `site/${locale}`;
    const home = { label: t("Home"), href: "community-list.html" };
    files.set(`${at}/index.html`, page("who-iris", [{ label: t("Home") }], landingPage(all), "site", [], "index.html"));
    files.set(
      `${at}/community-list.html`,
      page(t("List of Communities"), [home, { label: t("Community List") }], communityList(all), "site", [], "community-list.html"),
    );
    for (const c of all.filter((n) => n.flavour === "collection")) {
      const f = replicaPageOf(c)!;
      files.set(`${at}/${f}`, page(c.title, [home, { label: c.title, record: {} }], collectionPage(c, all), "site", [], f));
    }
    for (const n of all.filter((x) => x.flavour === "item")) {
      const f = replicaPageOf(n)!;
      files.set(`${at}/${f}`, page(n.title, [home, { label: n.title, record: { lang: langOf(n) } }], itemPage(n, all), "site", [], f));
    }
  }
  LOCALE = "en";

  const check = process.argv.includes("--check");
  let stale = 0;
  // The catalogues are checked with the pages, because a page built from a
  // stale or partial catalogue is a stale page: `iris:pages:check` is the one
  // gate, as it was before there was anything to translate.
  const drift = check ? catalogueProblems() : { problems: [], notes: [] };
  /* ONE LOOP OVER BOTH MAPS, reported repo-relative.
   *
   * `--check` has to cover the site-side page exactly as it covers the two
   * instance-side ones. A viewer that only the write path knows about is a
   * viewer CI cannot tell is stale, which is the `voices` defect this
   * repository spent 2026-09-22 on: a committed generated artefact nobody
   * re-derived, asserting a number no generator would emit.
   */
  /* THE GUARD THAT A LIST CANNOT BE: every page is owned by ITS OWN SIDE.
   *
   * `catalogue.html` was written to `docs/` while `OWNED_DOCS` did not name
   * it, so the orphan sweep could never reclaim it (bean `o6vj`, issue #895).
   * The existing test did not catch this because it asked the UNION — and
   * `OWNED` did contain `catalogue`, so it passed. The per-side property is
   * the one that was missing.
   *
   * Asserted at WRITE TIME rather than in a test, and that is the point: a
   * list of expected pages goes stale silently and is edited by whoever
   * remembers, which is how six enumerations of this one fact accumulated.
   * A check that runs on every invocation — including `--check` in CI —
   * cannot. Adding a page to a side its pattern does not own now fails
   * immediately, naming the page and the side.
   */
  for (const key of files.keys()) {
    const slash = key.indexOf("/");
    const side = key.slice(0, slash) as Side;
    const name = key.slice(slash + 1);
    if (!SIDES.includes(side)) {
      throw new Error(
        `gen-iris-pages: "${key}" names side "${side}", which is not one of ` +
          `${SIDES.join(", ")}. The map key carries the side; it cannot be invented.`,
      );
    }
    if (!ownedOn(side).test(name)) {
      throw new Error(
        `gen-iris-pages: writing "${key}", but the ${side} side does not OWN "${name}" ` +
          `(${ownedOn(side).source}). An unowned page is one the orphan sweep can never ` +
          `reclaim — exactly the \`catalogue.html\` defect (issue #895). Add it to ` +
          `PAGES.${side}.fixed, or write it to the side that owns it.`,
      );
    }
  }
  const targets: { abs: string; rel: string; html: string }[] = [
    ...[...files].map(([key, html]) => ({
      abs: join(INSTANCE, key),
      rel: `who-iris/${key}`,
      html,
    })),
    // THE NAVBAR GOES ON THE SITE SIDE ONLY — bean `edx7`.
    //
    // The split is already here and it is the right one. `siteFiles` are
    // cat-harness's own viewers of this catalogue, and the owner named
    // `/cat-harness/catalogue/who-iris/` as a page that SHOULD carry the rail.
    // `files` are the REPLICA, copied to look like IRIS; folio-assistant's
    // chrome on those would be the opposite of what a replica is for.
    // The mount's withheld list, beside the pages it protects (bean `cw35`).
    { abs: join(LIB, "withheld.json"), rel: "who-iris/library/withheld.json", html: withheldManifest(nodes()) },
    ...[...siteFiles].map(([abs, html]) => ({
      abs,
      rel: relative(REPO_ROOT, abs),
      html: withViewerNav(html, abs, { built: basename(HARNESS_ROOT), docsRoot: join(HARNESS_ROOT, siteDirFor(HARNESS_ROOT)) }) ?? html,
    })),
  ];
  for (const { abs, rel, html } of targets) {
    const prev = existsSync(abs) ? readFileSync(abs, "utf-8") : undefined;
    if (prev === html) continue;
    if (check) {
      console.error(`stale or missing: ${rel}`);
      stale++;
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, html);
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
    ...orphansIn(SITE, OWNED_SITE).map((f) => ({ dir: SITE, name: f, rel: `who-iris/site/${f}` })),
    ...orphansIn(DOCS, OWNED_DOCS).map((f) => ({ dir: DOCS, name: f, rel: `who-iris/docs/${f}` })),
    // The pages that CHANGED SIDES, and the predicate here is deliberately
    // NOT the one above. A page carrying the other side's name does not belong
    // in this directory AT ALL — whether or not it is currently being written
    // somewhere else. The first draft asked `!files.has(name)` here too, and
    // every stale copy survived: `index.html` is being written to `library/`,
    // so the docs-side copy looked live and stayed exactly where the owner did
    // not want it. Caught by listing the directory afterwards rather than by
    // trusting the sweep.
    ...wrongSide(DOCS, OWNED_SITE, OWNED_DOCS).map((f) => ({ dir: DOCS, name: f, rel: `who-iris/docs/${f}` })),
    ...wrongSide(SITE, OWNED_DOCS, OWNED_SITE).map((f) => ({ dir: SITE, name: f, rel: `who-iris/site/${f}` })),
    // `library/` IS CORPUS ONLY (bean `2b5s`), so no page of this generator's
    // belongs there at all. This is the sweep with teeth: an `index.html` left
    // in `library/` is what made the mount copy the whole corpus to two
    // published routes, so a stale one is pruned rather than tolerated.
    ...wrongSide(LIB, OWNED, /(?!)/).map((f) => ({ dir: LIB, name: f, rel: `who-iris/library/${f}` })),
    // Each language's copy, swept the same way inside its own directory.
    ...SITE_LOCALES.flatMap((loc) => {
      const dir = join(SITE, loc);
      return existsSync(dir)
        ? readdirSync(dir)
            .filter((f) => OWNED_SITE.test(f) && !files.has(`site/${loc}/${f}`))
            .sort()
            .map((f) => ({ dir, name: f, rel: `who-iris/site/${loc}/${f}` }))
        : [];
    }),
  ];

  if (check) {
    for (const o of orphans) console.error(`orphaned: ${o.rel}`);
    for (const d of drift.problems) console.error(`translation: ${d}`);
    if (stale || orphans.length || drift.problems.length) {
      const bits = [
        stale ? `${stale} page(s) stale` : "",
        orphans.length ? `${orphans.length} orphaned` : "",
        drift.problems.length ? `${drift.problems.length} translation problem(s)` : "",
      ].filter(Boolean).join(", ");
      console.error(`\n${bits}. Run: bun run who-iris/scripts/gen-iris-pages.ts`);
      return 1;
    }
    // `targets.length`, NOT `files.size` — the site-side viewer is checked and
    // has to be counted, or a clean run reports 10 while 11 were verified. A
    // summary that undercounts what it checked is the mirror of one that
    // overcounts: both leave a reader unable to tell coverage from omission.
    console.log(`gen-iris-pages --check: ${targets.length} page(s) up to date, no orphans.`);
    console.log(`  translations (${SITE_STRINGS.length} strings): ${drift.notes.join("; ")}`);
    return 0;
  }

  for (const o of orphans) rmSync(join(o.dir, o.name));

  const site = [...files.keys()].filter((k) => k.startsWith("site/"));
  // (Each language's pages are under site/<locale>/ and counted with site/.)
  const docs = [...files.keys()].filter((k) => k.startsWith("docs/"));
  console.log(`wrote ${site.length} page(s) to who-iris/site/ and ${docs.length} to who-iris/docs/`);
  for (const key of [...site, ...docs]) console.log(`  who-iris/${key}`);
  for (const o of orphans) console.log(`  pruned ${o.rel}`);
  return 0;
}

if (import.meta.main) process.exit(main());
