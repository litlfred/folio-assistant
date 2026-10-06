/**
 * The viewer page's COMMON FIXTURE — one `emit`, and the navbar comes with it.
 *
 * Owner, 2026-09-23, naming three pages and then the rule:
 *
 * > navbar should be on sub pages like `/cat-harness/catalogue/who-iris/` or
 * > `/cat-harness/auto-docs/index/docs/who-iris-docs/` or library
 * > etc... **common fixture unless explicty removed in harness visualtion.**
 *
 * The last clause inverts the default. The rail is PRESENT unless a
 * visualisation explicitly removes it, rather than absent unless a generator
 * remembers to add it — and that difference is the whole of this module,
 * because the measurement it was written from was **0 of 46**.
 *
 * ## Why this is an `emit`, not a helper each generator calls
 *
 * A `withNavbar(html)` that every generator pipes its output through would fix
 * today's 46 and leave the next generator free to forget, which is the failure
 * already paid for: nine generators each wrote their own `<html>` shell and
 * not one of them reached {@link injectRail}. The chokepoint has to be the
 * thing a generator cannot avoid using, and that is the write.
 *
 * Five of those nine already had a BYTE-IDENTICAL `emit` — same check-or-write
 * contract, same messages, same counter, copied five times. So the fixture is
 * not new machinery bolted on; it is the function they were all already
 * calling, hoisted once and given one more job.
 *
 * ## What this module does NOT decide
 *
 * Nothing about how the navbar looks, or what its three regions are. That is
 * `lib/navbar.ts`, and `sjic` is in flight on it. This module composes a MODEL
 * from the declarations and hands it to {@link injectRail}, exactly as
 * `mount-instance-docs.ts` does for mounted pages — so when `sjic` changes the
 * component, these 46 pages change with it and nothing here moves. That is the
 * test of whether the boundary was drawn in the right place, and it is the
 * same test `harness-rail.ts` applies to `603s`'s avatars.
 *
 * Two callers, one component, and no third answer to "what does the harness's
 * navigation look like".
 *
 * ## The opt-out is a DECLARATION IN THE PAGE, not a list here
 *
 * {@link NAVBAR_OPT_OUT} is a `<meta>` the generator writes. A list of exempt
 * paths in this file would be a second answer to "does this page want a rail",
 * free to disagree with the generator that draws it and invisible to anyone
 * reading the page. It would also go stale the first time a path moved — the
 * `check:declared-assets` defect, which this repository has now paid for more
 * than once.
 *
 * **Nothing in the committed tree uses it today**, and that is stated rather
 * than hidden: the owner named `catalogue/who-iris/` as a page that SHOULD
 * carry the rail, so the obvious candidate is not a candidate. The real one is
 * the mounted IRIS replica at `/who-iris/`, which is not a generated viewer
 * page and so is not in this family at all. An opt-out with no user is still
 * the difference between "this page deliberately has no rail" and "nobody
 * wired it", and those two must not render the same — `check-viewer-nav.ts`
 * is what reads the difference.
 *
 * @module scripts/viewer-page
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { declinesNavbar, injectRail, type NavItem } from "./lib/harness-rail.js";
import { withSavedScheme } from "./lib/scheme-css.js";
// Moved to `lib/scheme-css.ts` (issue #2208) so a folio's page gets it too
// without importing this module, which imports `mount-instance-docs.ts`.
export { schemeKey, withSavedScheme } from "./lib/scheme-css.js";
import { VISUALISER_NAV_ATTR, visualiserNavDeclaration, type VisualiserNavEntry } from "./lib/navbar.js";
import { kindTitle } from "./lib/nav-label.js";
import { declaredGraphs, instanceMark, instantiatedHarnesses, navbarRowData, publishedGraphs, railNames } from "./mount-instance-docs.js";

/**
 * The opt-out a visualisation writes into its own page.
 *
 * Matched rather than composed on the way in, so a generator that writes the
 * attributes in the other order still opts out — the page is the declaration,
 * and a reader who writes valid HTML should not lose to an attribute order.
 */
export const NAVBAR_OPT_OUT = `<meta name="folio-navbar" content="none">`;

/** Does this page explicitly decline the navbar? One definition, beside the rail it declines. */
export { declinesNavbar };

/**
 * Is this a page Jekyll's layout never reaches?
 *
 * The criterion is the same one the rail exists for. A source page under the
 * docs directory begins with YAML front matter and gets the theme's sidebar
 * from the layout; a generated viewer page is a whole `<html>` document that
 * Jekyll copies through untouched, so it gets whatever its generator drew and
 * nothing else.
 *
 * Read off the CONTENT rather than the path, because a path list is a second
 * answer — and because the property that matters ("no layout will wrap this")
 * is a property of the file.
 */
export function isStandalonePage(html: string): boolean {
  return /^\s*<!doctype html>/i.test(html);
}

/** Where a page sits, and whose graphs its rail should list. */
export interface ViewerNav {
  /** The built instance's directory name, e.g. `cat-harness`. */
  built: string;
  /** Absolute path of the published docs directory this page is written under. */
  docsRoot: string;
  /**
   * Whose graphs the rail lists. Defaults to {@link built}.
   *
   * A generator that knows better PASSES it — `gen-library-viz` writes
   * `library/<instance>/` and has the instance in hand. What no caller does is
   * INFER it from the path: `auto-docs/index/skills/who-iris-skills/` would
   * have to be un-suffixed to yield `who-iris`, and a rule that strips
   * `-skills` here is a second answer to a question the generator already
   * answered, free to disagree with it and silently wrong on the first
   * directory that ends in those characters for another reason.
   */
  instance?: string;
  /**
   * The page's OWN rail section, when its headings cannot supply one — a view
   * drawn by script has none at build time (#1757). Written into the page as
   * a `data-fa-visualiser-nav` declaration unless the page already carries
   * one. {@link subjectSection} builds the common shape.
   */
  section?: readonly VisualiserNavEntry[];
  /**
   * Where the rail's SHARED data goes — the absolute path and the bytes
   * (bean `lnoy`, owner: *"4. Option 3 everywhere"*). Given, the page carries
   * only its own rail block and links the shared data, `navbar.css` and
   * `navbar.js`; {@link makeEmit} supplies it with the same check-or-write
   * contract as the page. Absent, the rail is rendered into the page, so a
   * page that must fetch nothing (the state dashboards) still has one.
   */
  emitAsset?: (path: string, body: string) => void;
}

/**
 * The section a HANDLER's viewer gives its rail: the whole view, then one row
 * per subject page, with this page's own regions under the row it is.
 *
 * Every handler viewer here (`folio`, `schemas`, `uploads`, `voices`) has the
 * same two-level shape — one page over every instance, one page per subject —
 * so the shape is written once. The current page's row carries no href (a
 * link to here is a control that does nothing) and holds its regions, which
 * are the page's static containers: they are what exists to be scrolled to
 * before the script has drawn anything.
 *
 * @param subjects the subject pages, by the segment each is published under
 * @param current  this page's subject, or `undefined` on the whole-view page
 * @param regions  this page's own anchors, in reading order
 */
export function subjectSection(
  subjects: readonly string[],
  current: string | undefined,
  regions: readonly { label: string; id: string }[],
  /**
   * What each subject page is CALLED. A subject page is a destination other
   * surfaces name too (`/cat-harness/schemas/cat-harness/` is "Schemas" in
   * the Graphs group), so its row takes that one name with the harness as the
   * qualifier: "Schemas · C@T Harness". Bean `ob3m` finding 6. Omitted, a row
   * is the bare segment, as before.
   *
   * Called with `undefined`, it names the WHOLE-VIEW page. That page is a
   * destination too: an instance with a graph of this kind but no subject page
   * of its own (who-iris's and folio-assistant-sci's `schemas`, since bean
   * `j7ql`) links it, and the sidebar and landing call it "Schemas". Naming it
   * "all" here was a second name for that one page. Omitted, it is "all".
   */
  name?: (subject: string | undefined) => { label: string; qualifier?: string },
): VisualiserNavEntry[] {
  const anchors = regions.map((r) => ({ label: r.label, href: `#${r.id}` }));
  const up = current === undefined ? "" : "../";
  const named = (s: string): { label: string; qualifier?: string } => name?.(s) ?? { label: s };
  const whole = name?.(undefined) ?? { label: "all" };
  return [
    current === undefined ? { ...whole, items: anchors } : { ...whole, href: up },
    ...subjects.map((s) =>
      s === current ? { ...named(s), items: anchors } : { ...named(s), href: `${up}${s}/` },
    ),
  ];
}

/**
 * {@link subjectSection}'s `name` for a handler's viewer of `kind`: the kind's
 * display name, qualified by each subject harness's own name from
 * `_data/harness.json` (its directory name when the data cannot say).
 */
export function subjectNames(
  built: string,
  kind: string,
): (subject: string | undefined) => { label: string; qualifier?: string } {
  const label = kindTitle(kind);
  return (subject) => (subject === undefined ? { label } : { label, qualifier: railNames(built, subject).harness ?? subject });
}

/**
 * The page's path back to the site root — `..`, `../..`, …
 *
 * Derived from where the file is being written relative to the docs root,
 * because that IS the published path: the workflows pass the docs directory as
 * Jekyll's `source:`, so a page committed at `<docs>/x/y/index.html` is served
 * at `/x/y/`.
 */
export function toRootForPage(docsRoot: string, pageAbs: string): string {
  const rel = relative(docsRoot, pageAbs).split(sep);
  const depth = rel.length - 1; // the filename is not a directory
  return depth === 0 ? "." : new Array(depth).fill("..").join("/");
}

/** The page's own site-absolute path, e.g. `/cat-harness/library/who-iris/`. */
export function sitePathForPage(docsRoot: string, pageAbs: string): string {
  const dir = relative(docsRoot, dirname(pageAbs)).split(sep).filter(Boolean);
  return dir.length === 0 ? "/" : `/${dir.join("/")}/`;
}

/**
 * Put the harness navbar into a finished viewer page.
 *
 * `undefined` when the page declines it, when it is not a standalone document,
 * or when {@link injectRail} refuses — and the three are NOT distinguished
 * here on purpose. This function's caller is a write; it needs to know whether
 * to substitute, and nothing more. The audit that has to tell a declined page
 * from an unrailed one reads the page, which is where the difference is
 * recorded. Two readers, one fact.
 */
export function withViewerNav(html: string, pageAbs: string, o: ViewerNav): string | undefined {
  if (!isStandalonePage(html) || declinesNavbar(html)) return undefined;

  const instance = o.instance ?? o.built;
  const toRoot = toRootForPage(o.docsRoot, pageAbs);
  const here = sitePathForPage(o.docsRoot, pageAbs);

  // `linked` is empty because this is not a mount pass: there is no instance
  // route to prefer. `publishedGraphs` is the right and only witness here —
  // these pages ARE the handler's viewers, so `harness.json`'s visualisation
  // paths point at the family this page belongs to.
  const site = publishedGraphs(o.built, instance, toRoot);
  // The visualiser this page IS — the row the loop below marks current. Its
  // label names the page's own section in the rail (#1757).
  let visualiserLabel: string | undefined;
  const named = railNames(o.built, instance);
  const links: NavItem[] = declaredGraphs(instance, new Map(), site, named.harness).map((item) => {
    // WHERE AM I — and the row loses its HREF, not just gains a mark.
    //
    // `state-visualizer.test.ts` states the rule this repository already
    // holds: *"A link to here is a control that does nothing, and a reader who
    // clicks it learns only that it did nothing. The current row is plain
    // text."* The first version of this marked the row and kept the link, and
    // that test is what caught it — on the `/beans/` page, whose rail then
    // carried `href="../beans/"`. It is the same `l4zi` shape as an action
    // whose inverse is not reachable: a control that cannot do anything is
    // not a control.
    //
    // Compared against the RESOLVED href rather than the kind, because a kind
    // may be published at a path that does not contain its name.
    if (item.href === undefined || item.href !== `${toRoot}${here}`) return item;
    visualiserLabel = item.label;
    // From SHARED data the browser marks it (`renderRailRegions`, given
    // `here`): the data is the same for every page that shares it.
    if (o.emitAsset) return item;
    const { href: _here, ...rest } = item;
    return { ...rest, current: true };
  });

  const harnesses = instantiatedHarnesses(o.built, toRoot);
  // No current row — a page whose graph this instance does not itself declare,
  // `/todos/` under cat-harness — is still a visualiser, and its section is
  // named for the page rather than called "Contents".
  visualiserLabel ??= here.split("/").filter(Boolean).pop();
  const mark = instanceMark(o.built, instance, toRoot);
  let own = html;
  if (o.section?.length && !html.includes(VISUALISER_NAV_ATTR)) {
    const body = /<body\b[^>]*>/i.exec(html);
    if (body) {
      const at = body.index + body[0].length;
      own = html.slice(0, at) + visualiserNavDeclaration(o.section) + html.slice(at);
    }
  }
  const railed = injectRail(withHeadingIds(own), {
    instance: named.harness ?? instance,
    ...(named.site ? { homeLabel: named.site } : {}),
    toRoot,
    ...(mark ? { mark } : {}),
    ...(visualiserLabel ? { visualiserLabel } : {}),
    links,
    ...(harnesses ? { harnesses } : {}),
    navbarRow: navbarRowData(o.built),
    // INLINED, like the narrow-viewport rules below: these pages fetch nothing
    // (`state-visualizer.test.ts` holds them to it). Bean `lhvt`.
    ...(o.emitAsset
      ? { here, emitRailData: (file: string, body: string) => o.emitAsset!(join(o.docsRoot, file), body) }
      : { inlineRowAssets: navbarRowAssets() }),
  });
  return railed === undefined ? undefined : withNarrowViewport(withSavedScheme(railed));
}

/**
 * The narrow-viewport rules, inlined into a standalone viewer page — bean `2r2n`.
 *
 * A standalone page loads no theme stylesheet, so the rules that stop a wide
 * table widening the page at 390 px reach it only if they are written INTO it.
 * They come from the same file the themed pages link
 * (`assets/css/narrow-viewport.css`), read at generation time, so there is one
 * set of rules and not a copy per surface. Before this, 19 of these pages
 * scrolled sideways at phone width.
 *
 * Rides on the rail because this is the one write every viewer generator makes.
 * Idempotent: a page that already carries the block is returned unchanged.
 */
export function withNarrowViewport(html: string): string {
  if (html.includes(NARROW_MARK)) return html;
  const head = /<\/head>/i.exec(html);
  const block = `<style ${NARROW_MARK}>\n${narrowViewportCss()}</style>\n`;
  if (head) return html.slice(0, head.index) + block + html.slice(head.index);
  const body = /<body\b[^>]*>/i.exec(html);
  if (!body) return html;
  const at = body.index + body[0].length;
  return html.slice(0, at) + block + html.slice(at);
}

const NARROW_MARK = `data-folio-narrow-viewport`;

let rowAssets: { js: string; css: string } | undefined;
/** The harness icon row's script and stylesheet, read once — inlined by {@link withViewerNav}. */
function navbarRowAssets(): { js: string; css: string } {
  // declared-path-literal: platform assets beside this module, not a folio
  // directory. The docs site publishes them at the same relative paths.
  rowAssets ??= {
    js: readFileSync(new URL("../docs/assets/js/navbar-row.js", import.meta.url), "utf-8"),
    css: readFileSync(new URL("../docs/assets/css/navbar-row.css", import.meta.url), "utf-8"),
  };
  return rowAssets;
}

let narrowCss: string | undefined;
function narrowViewportCss(): string {
  // declared-path-literal: a platform asset beside this module, not a folio
  // directory. The docs site publishes it at the same relative path.
  narrowCss ??= readFileSync(new URL("../docs/assets/css/narrow-viewport.css", import.meta.url), "utf-8");
  return narrowCss;
}

/** What {@link makeEmit} needs in order to be the fixture rather than a writer. */
export interface EmitOptions {
  /** `--check`: report staleness and write nothing. */
  check: boolean;
  /** Called once per stale or missing artefact, so the caller keeps its own counter. */
  onStale: () => void;
  /**
   * Suppress the per-file `✓` line. For a generator that reports by LEVEL
   * rather than by file — changing what it prints would change what a reader
   * of its output is being told, which is not this change's subject.
   */
  quiet?: boolean;
  /**
   * Where the navbar comes from. OMITTED by a generator that writes no pages —
   * and omitting it is a decision, not a default: an emitter with no nav
   * writes exactly what it is given, which is what every JSON sidecar beside a
   * viewer page needs.
   */
  nav?: ViewerNav;
}

/**
 * The check-or-write every viewer generator already had, plus the fixture.
 *
 * The navbar is applied BEFORE the staleness comparison, so `--check` and the
 * write are asking about the same bytes. Applying it after would make every
 * gate green over pages that gain a rail only when somebody runs the
 * generator — a gate that cannot see what it is gating.
 */
export function makeEmit(o: EmitOptions): (path: string, content: string) => void {
  // The rail's shared data (bean `lnoy`): many pages name one file, so it is
  // checked or written once per run, under the same contract as a page.
  const seen = new Set<string>();
  const emitAsset = (path: string, body: string): void => {
    if (seen.has(path)) return;
    seen.add(path);
    if (o.check) {
      const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
      if (current === body) return;
      console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
      o.onStale();
      return;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  };
  return (path: string, content: string): void => {
    const railed = o.nav ? withViewerNav(content, path, { ...o.nav, emitAsset }) : undefined;
    const final = railed ?? content;

    if (o.check) {
      const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
      if (current === final) return;
      console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
      o.onStale();
      return;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, final);
    if (!o.quiet) console.log(`  ✓ ${path}`);
  };
}

/**
 * Give every `h2`/`h3` WITHOUT an id one, so the page's own sections can be
 * indexed in its rail (#1757: *"make a qa flag to define LHS navbar for any
 * visualizer"*).
 *
 * `documentIndexOf` indexes only headings with an id — a heading without one
 * is not a destination — and 54 of the 55 generated viewer pages wrote none,
 * so every one of them arrived with no section of its own. Minting the id here
 * fixes the family in one place rather than in nine generators, and it is safe
 * HERE in a way it would not be in `mount-instance-docs.ts`: `withViewerNav`
 * only ever sees pages this repository generates, never a copied document.
 *
 * Existing ids are left alone and minted ones never collide with them.
 */
export function withHeadingIds(html: string): string {
  const taken = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!));
  // NEVER inside `<script>` or `<style>`: a client-rendered view builds its
  // headings from string templates, and an id minted into one is an edit to
  // somebody's JavaScript (found on the voices pages, `"<h2>" + esc(v.title)`).
  return html
    .split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i)
    .map((part, i) => (i % 2 === 1 ? part : idsIn(part, taken)))
    .join("");
}

function idsIn(html: string, taken: Set<string>): string {
  return html.replace(/<(h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (whole, tag: string, attrs: string, inner: string) => {
    if (/\bid=/.test(attrs)) return whole;
    const base =
      "sec-" +
      (inner
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "section");
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
}
