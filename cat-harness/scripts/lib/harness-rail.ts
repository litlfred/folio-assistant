/**
 * The harness rail — now a thin ADAPTER over the shared navbar.
 *
 * ## What moved, and why this file still exists
 *
 * Owner, 2026-09-21: *"we should have same navbar across all folios though.
 * presented same way. need to comine the two."* The markup, the stylesheet and
 * the three-region layout are in `lib/navbar.ts`; what stays here is the one
 * thing that is genuinely about MOUNTED PAGES:
 *
 * > a page Jekyll never rendered gets no layout, so the harness's navigation
 * > has to be injected into somebody else's finished document.
 *
 * `mount-instance-docs.ts` does that injection and this file gives it the
 * model. Nothing about the navbar's appearance is decided here any more, which
 * is the whole point: the rail and the site sidebar stopped being two
 * implementations that agree by maintenance.
 *
 * ## Why the rail went first
 *
 * Owner's ruling on the collision, 2026-09-21: split by layer. `603s` (PR
 * #791) is mid-flight on the harness avatars and themes, and the Jekyll
 * sidebar's own include is where the two would collide — so the sidebar
 * switches to `navbar.ts` after that lands. The rail is the side with no other
 * claimant, which makes it the side where the component can be got right
 * without re-resolving against three moving branches.
 *
 * ## No JavaScript, and here it is not a preference
 *
 * These documents are copied verbatim from instances the harness does not
 * control. Injecting a nav into somebody else's page is one claim; injecting
 * script into it is a larger one.
 *
 * @module scripts/lib/harness-rail
 */
export {
  documentIndexOf,
  visualiserNavOf,
  NAV_COLLAPSED_PX,
  NAV_GLYPH_PX,
  NAV_OPEN_PX,
  NAV_PAD_PX,
  injectNavbar,
  navbarCss,
  navbarHtml,
} from "./navbar.js";
export type { NavGroup, NavItem, NavbarModel } from "./navbar.js";

import { documentIndexOf, injectNavbar, visualiserNavOf, type NavGroup, type NavItem, type NavbarModel } from "./navbar.js";

/** What a mounted page needs in order to describe its own navbar. */
export interface RailOptions {
  /** The instance whose page this is. */
  instance: string;
  /** Path back to the site root from this page — `..`, `../..`, … */
  toRoot: string;
  /** The instance's own themed root, for the fixed top — never inside the graphs group. */
  root?: NavItem;
  /** This instance's own graphs — the scrollable middle. */
  links: readonly NavItem[];
  /**
   * The instantiated harnesses, for the fixed bottom.
   *
   * Optional because a caller that cannot read `_data/harness.json` must be
   * able to say so by OMITTING the region rather than by passing an empty one.
   * An empty disclosure labelled "Harnesses" invites a click that does
   * nothing, and reads as a site with no harnesses rather than as a navbar
   * that could not find out.
   */
  harnesses?: readonly NavItem[];
  /**
   * The open document's own index, for the fixed top.
   *
   * Optional, and ABSENT rather than empty when the page has fewer than two
   * addressable headings — `documentIndexOf` makes that call, because "this
   * page has no index" and "we did not look" must not render the same.
   */
  documentIndex?: NavGroup;
  /**
   * The instance's mark for the header — avatar, or tone for its initial.
   * `instanceMark` in `mount-instance-docs.ts` reads it off the same
   * `_data/harness.json` the harnesses region comes from.
   */
  mark?: NavbarModel["mark"];
  /**
   * What the page's own section is CALLED — the visualiser's name, `todos` on
   * `/todos/`. Absent on a mounted document, whose section is its "Contents".
   */
  visualiserLabel?: string;
  /**
   * What the home row is called — the site's title from `harness.json`, the
   * same words the Jekyll sidebar's home row shows (bean `ob3m` finding 6).
   * Absent falls back to `folio-assistant`.
   */
  homeLabel?: string;
}

/**
 * The model for a mounted page.
 *
 * `home` is last in the fixed bottom — *"keep home at bottom for who iris."*
 * It is the one item whose href this file composes, because `toRoot` is the
 * only piece of routing a mounted page knows about itself.
 */
export function railModel(o: RailOptions): NavbarModel & { graphs: NavGroup } {
  const harnesses: NavGroup | undefined =
    o.harnesses === undefined
      ? undefined
      : { label: "Harnesses", icon: "\u25A6", items: o.harnesses, collapsible: true };
  return {
    instance: o.instance,
    ...(o.mark ? { mark: o.mark } : {}),
    ...(o.root ? { root: o.root } : {}),
    // THE PAGE'S OWN INDEX IS ITS VISUALISER SECTION (#1757), open on arrival,
    // and it sits at the head of the scrolling middle rather than in the fixed
    // top. It was a "Contents" disclosure in the top that arrived FOLDED while
    // "Graphs" arrived open — the one section about this page was the one you
    // had to open. *"by default, only the current pages visualiers LHS navbar
    // is open"*.
    ...(o.documentIndex ? { visualiser: o.documentIndex } : {}),
    // Collapsible so the whole stack folds in one click -- the owner's
    // "librarues should be in hambuger menu so can collase all" -- and FOLDED
    // on arrival on every page: owner, 2026-10-05 (#2150), *"also have the
    // "Graphs" section start closed on LHS navbar"*. It was open whenever the
    // page had no section of its own. `navbarRegionsHtml` still opens it when
    // one of its rows is the current page, so the reader's place stays visible.
    graphs: { label: "Graphs", icon: "\u25A4", items: o.links, collapsible: true, open: false },
    ...(harnesses ? { harnesses } : {}),
    home: { href: `${o.toRoot}/`, label: o.homeLabel ?? "folio-assistant", icon: "\u2302" },
  };
}

const OPT_OUT_RE = /<meta\s+[^>]*name=["']folio-navbar["'][^>]*content=["']none["'][^>]*>/i;
const OPT_OUT_RE_SWAPPED = /<meta\s+[^>]*content=["']none["'][^>]*name=["']folio-navbar["'][^>]*>/i;

/**
 * Does this page explicitly decline the navbar (`<meta name="folio-navbar"
 * content="none">`, either attribute order)?
 *
 * HERE, beside {@link injectRail}, so that EVERY pass that injects a rail can
 * ask it — the generator's own write (`viewer-page.ts`) and the post-build
 * site walk (`railStandalonePages`). Until #1881 only the first asked, so a
 * page that declined at generation was railed anyway by the second, in CI only:
 * a 2.8 KB library entry shell published at 25 KB.
 */
export function declinesNavbar(html: string): boolean {
  return OPT_OUT_RE.test(html) || OPT_OUT_RE_SWAPPED.test(html);
}

/**
 * Put the rail into a finished document. Refuses a page with no `<body>`.
 *
 * THE DOCUMENT INDEX IS READ OFF `html` HERE, not passed in, and that is the
 * point: this function already holds the finished page, so the caller cannot
 * hand it an index belonging to a different document. `mount-instance-docs.ts`
 * loops over hundreds of files, and "the right nav with the previous page's
 * contents" is the failure that shape invites.
 *
 * An explicit `o.documentIndex` still wins, for a caller that has a better
 * answer than the headings — a declared index in the graph, say.
 */
export function injectRail(html: string, o: RailOptions): string | undefined {
  const label = o.visualiserLabel ?? "Contents";
  const documentIndex = o.documentIndex ?? visualiserNavOf(html, label) ?? documentIndexOf(html, label);
  return injectNavbar(html, railModel({ ...o, ...(documentIndex ? { documentIndex } : {}) }));
}
