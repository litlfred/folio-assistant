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
  NAV_COLLAPSED_PX,
  NAV_GLYPH_PX,
  NAV_OPEN_PX,
  NAV_PAD_PX,
  injectNavbar,
  navbarCss,
  navbarHtml,
} from "./navbar.js";
export type { NavGroup, NavItem, NavbarModel } from "./navbar.js";

import { documentIndexOf, injectNavbar, type NavGroup, type NavItem, type NavbarModel } from "./navbar.js";

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
    ...(o.root ? { root: o.root } : {}),
    ...(o.documentIndex ? { documentIndex: o.documentIndex } : {}),
    // Collapsible so the whole stack folds in one click -- the owner's
    // "librarues should be in hambuger menu so can collase all" -- and OPEN
    // by default, because a navbar whose content arrives folded looks empty.
    graphs: { label: "Graphs", icon: "\u25A4", items: o.links, collapsible: true, open: true },
    ...(harnesses ? { harnesses } : {}),
    home: { href: `${o.toRoot}/`, label: "folio-assistant", icon: "\u2302" },
  };
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
  const documentIndex = o.documentIndex ?? documentIndexOf(html);
  return injectNavbar(html, railModel({ ...o, ...(documentIndex ? { documentIndex } : {}) }));
}
