/**
 * The viewer page's COMMON FIXTURE — one `emit`, and the navbar comes with it.
 *
 * Owner, 2026-09-23, naming three pages and then the rule:
 *
 * > navbar should be on sub pages like `/cat-harness/catalogue/who-iris/` or
 * > `/cat-harness/docs-auto/index/docs/who-iris-docs/` or library
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
import { dirname, relative, sep } from "node:path";

import { injectRail, type NavItem } from "./lib/harness-rail.js";
import { declaredGraphs, instantiatedHarnesses, publishedGraphs } from "./mount-instance-docs.js";

/**
 * The opt-out a visualisation writes into its own page.
 *
 * Matched rather than composed on the way in, so a generator that writes the
 * attributes in the other order still opts out — the page is the declaration,
 * and a reader who writes valid HTML should not lose to an attribute order.
 */
export const NAVBAR_OPT_OUT = `<meta name="folio-navbar" content="none">`;

const OPT_OUT_RE = /<meta\s+[^>]*name=["']folio-navbar["'][^>]*content=["']none["'][^>]*>/i;
const OPT_OUT_RE_SWAPPED = /<meta\s+[^>]*content=["']none["'][^>]*name=["']folio-navbar["'][^>]*>/i;

/** Does this page explicitly decline the navbar? */
export function declinesNavbar(html: string): boolean {
  return OPT_OUT_RE.test(html) || OPT_OUT_RE_SWAPPED.test(html);
}

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
   * INFER it from the path: `docs-auto/index/skills/who-iris-skills/` would
   * have to be un-suffixed to yield `who-iris`, and a rule that strips
   * `-skills` here is a second answer to a question the generator already
   * answered, free to disagree with it and silently wrong on the first
   * directory that ends in those characters for another reason.
   */
  instance?: string;
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
  const links: NavItem[] = declaredGraphs(instance, new Map(), site).map((item) => {
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
    const { href: _here, ...rest } = item;
    return { ...rest, current: true };
  });

  const harnesses = instantiatedHarnesses(o.built, toRoot);
  return injectRail(html, {
    instance,
    toRoot,
    links,
    ...(harnesses ? { harnesses } : {}),
  });
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
  return (path: string, content: string): void => {
    const railed = o.nav ? withViewerNav(content, path, o.nav) : undefined;
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
