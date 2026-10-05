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

import { NAVBAR_CSS, documentIndexOf, injectNavbar, navbarRegionsHtml, visualiserNavOf, type NavGroup, type NavItem, type NavbarModel } from "./navbar.js";

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
   * Where the PLATFORM's site root is from this page, when it is not `toRoot`
   * — a folio's own Pages site, whose platform links and row files live on the
   * platform's site (`platformBase`). Default `toRoot`. Bean `lhvt`.
   */
  assetRoot?: string;
  /**
   * The row's script and stylesheet, to be INLINED rather than linked — for a
   * standalone viewer page that fetches nothing (`withViewerNav`), as its
   * narrow-viewport rules already are. Bean `lhvt`.
   */
  inlineRowAssets?: { js: string; css: string };
  /**
   * THE RAIL FROM SHARED DATA — owner, 2026-10-05: *"4. Option 3 everywhere"*
   * (bean `lnoy`). Given this, the page carries only what is ITS OWN (where
   * it is, its own section) and a placeholder `<nav>`; everything the rail
   * shares with its siblings is written ONCE, through this callback, as
   * `assets/navbar/rail-<hash>.js`, and `navbar.js` draws the rail from both.
   * Absent, the rail is rendered into the page as before (no script needed).
   */
  emitRailData?: (file: string, body: string) => void;
  /**
   * The page's own published path (`/cat-harness/library/`) — its row in the
   * rail is drawn as "you are here" rather than as a link to itself. Given
   * with {@link emitRailData}; a caller rendering markup marks the row itself.
   */
  here?: string;
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
   * The harness's NAVBAR ROW — the icon row (todos, beans, processes, kg,
   * fsh-guts, launcher) — exactly as `_data/harness.json` carries it under
   * `navbar`, which is what the Jekyll sidebar reads through
   * `head_custom.html`'s `#fa-navbar-row`.
   *
   * Bean `wckf` (#2147), owner 2026-10-05: *"still no LHS icons top navbar on
   * who-iris page"*, then *"this should be a common navbar functionality in
   * harness"* (bean `9rq1`). The row is drawn by ONE function,
   * `mountNavIconRow` in `docs-ui.js`; a railed page lacked only its DATA, so
   * this writes the same block the theme writes and the same function draws
   * the same row. No second renderer here, and no script: the rail stays
   * script-free, and a page without `docs-ui.js` simply shows no row.
   *
   * Three states, as everywhere the row is read: `undefined` — the caller
   * could not find out, nothing is written; `null` — declared none, written as
   * `null`, which `readNavbarRow` reports at info level; an object — the row.
   */
  navbarRow?: unknown;
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
    // "librarues should be in hambuger menu so can collase all". Open only
    // when the page has no section of its own; `navbarRegionsHtml` folds it
    // whenever a visualiser section is present.
    graphs: { label: "Graphs", icon: "\u25A4", items: o.links, collapsible: true, open: true },
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
 * The declaration a THIN page makes — rail me, but LINK the rail's style and
 * the row's script rather than inlining them. Owner, 2026-10-05: *"1. Shared
 * rail style first"*, for the library entries, OpenAPI operations and todo
 * pages that declined the rail because inlined it outweighed the page (bean
 * `lnoy`). Any pass that rails a page honours it, so the decision lives on the
 * page, as `none` does.
 */
export const NAVBAR_LINKED = `<meta name="folio-navbar" content="linked">`;
const LINKED_RE = /<meta\s+[^>]*name=["']folio-navbar["'][^>]*content=["']linked["'][^>]*>/i;
const LINKED_RE_SWAPPED = /<meta\s+[^>]*content=["']linked["'][^>]*name=["']folio-navbar["'][^>]*>/i;

/** Does this page ask for the rail with its style LINKED ({@link NAVBAR_LINKED})? */
export function wantsLinkedRail(html: string): boolean {
  return LINKED_RE.test(html) || LINKED_RE_SWAPPED.test(html);
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
  const root = o.assetRoot ?? o.toRoot;
  if (o.emitRailData) {
    const railed = withSharedRail(html, o, root, documentIndex);
    return railed === undefined ? undefined : withNavbarRow(railed, o.navbarRow, { root });
  }
  // A page that asked for LINKED assets gets them linked, whatever the caller
  // would otherwise inline: the page's declaration is the decision.
  const linked = wantsLinkedRail(html);
  const railed = injectNavbar(
    html,
    railModel({ ...o, ...(documentIndex ? { documentIndex } : {}) }),
    linked ? { cssHref: `${root}/${NAVBAR_CSS}` } : {},
  );
  return railed === undefined
    ? undefined
    : withNavbarRow(railed, o.navbarRow, { root, ...(o.inlineRowAssets && !linked ? { inline: o.inlineRowAssets } : {}) });
}

/** The id `docs-ui.js`'s `readNavbarRow` looks for — the same one `head_custom.html` writes. */
export const NAVBAR_ROW_ID = "fa-navbar-row";

/** Where the row's drawing and style are published, relative to the site root. */
export const NAVBAR_ROW_JS = "assets/js/navbar-row.js";
export const NAVBAR_ROW_CSS = "assets/css/navbar-row.css";
/** The attribute an INLINED copy of the row's script and style carries. */
export const NAVBAR_ROW_INLINE = "data-fa-navbar-row-inline";

/**
 * The navbar row's data block, written right after the opening `<body>` —
 * once, and never when `row` is `undefined` (see {@link RailOptions.navbarRow}).
 *
 * `<` is escaped so a value can never close the script element early: the
 * hrefs are generated, but "generated" is not "trusted" (`docs-ui.js`
 * `safeHref`'s own argument), and the bytes land inside somebody else's page.
 *
 * WITH `toRoot`, ALSO WHAT DRAWS IT — beans `lhvt`, `9rq1`. The data alone
 * was written onto 2,747 railed pages by #2149, and on the 2,709 of them that
 * never load `docs-ui.js` nothing drew it. `navbar-row.js` and its stylesheet
 * are linked before `</head>`, each once; a row the instance declined (`null`)
 * still gets them, so the decline is reported the same way on every page.
 */
export function withNavbarRow(
  html: string,
  row: unknown,
  at?: { root: string; inline?: { js: string; css: string } },
): string {
  if (row === undefined) return html;
  let out = html;
  if (!out.includes(`id="${NAVBAR_ROW_ID}"`)) {
    const body = /<body\b[^>]*>/i.exec(out);
    if (!body) return html;
    const pos = body.index + body[0].length;
    const json = JSON.stringify(row).replace(/</g, "\\u003c");
    // `data-fa-root` — the site root the row's site-root hrefs (`/beans/`) are
    // composed against. A railed page carries no `fa-baseurl` meta, and an
    // INLINED script has no address of its own to derive one from.
    const root = at ? ` data-fa-root="${at.root.replace(/"/g, "&quot;")}"` : "";
    out = out.slice(0, pos) + `<script type="application/json" id="${NAVBAR_ROW_ID}"${root}>${json}</script>` + out.slice(pos);
  }
  if (at === undefined || out.includes(NAVBAR_ROW_JS) || out.includes(NAVBAR_ROW_INLINE)) return out;
  const tags = at.inline
    ? `<style ${NAVBAR_ROW_INLINE}>${at.inline.css}</style><script ${NAVBAR_ROW_INLINE}>${at.inline.js}</script>`
    : `<link rel="stylesheet" href="${at.root}/${NAVBAR_ROW_CSS}">` + `<script src="${at.root}/${NAVBAR_ROW_JS}" defer></script>`;
  const head = /<\/head\s*>/i.exec(out);
  if (head) return out.slice(0, head.index) + tags + out.slice(head.index);
  const body = /<body\b[^>]*>/i.exec(out);
  return body ? out.slice(0, body.index + body[0].length) + tags + out.slice(body.index + body[0].length) : out;
}

/* ── THE RAIL FROM SHARED DATA — bean `lnoy` ───────────────────────────────
 *
 * Owner, 2026-10-05, choosing between a full rail in every page (+3.8 KB
 * gzipped each) and one drawn from shared data (+0.1 KB): *"4. Option 3
 * everywhere"*. Measured on a library entry: the rail's MARKUP was 20.8 KB of
 * a 26 KB page — 25 links, each with its glyph, tone and description twice.
 *
 * Split by what varies. SHARED (one file per distinct content, named by its
 * hash, so callers whose rails agree share it): the instance, its mark, root,
 * graphs, harnesses and home label. THE PAGE'S OWN: its depth, its published
 * path (for "you are here") and its own section. `navbar.js` — a bundle of
 * THIS module and `navbar.ts`, so the browser runs the same drawing the build
 * always ran — joins the two. One drawing, two places it runs.
 */

/** Stands for the site root inside shared data; each page puts back its own. */
export const RAIL_ROOT = "@fa-rail-root@";
/** Where shared rail data is published, relative to the site root. */
export const RAIL_DATA_DIR = "assets/navbar";
/** The bundle that draws a rail from shared data. */
export const NAVBAR_JS = "assets/js/navbar.js";
/** The page's own rail block. */
export const RAIL_PAGE_ID = "fa-rail";

/** What every page railed alike shares. Hrefs carry {@link RAIL_ROOT}. */
export interface RailShared {
  instance: string;
  mark?: NavbarModel["mark"];
  root?: NavItem;
  links: readonly NavItem[];
  harnesses?: readonly NavItem[];
  homeLabel?: string;
}

/** What is the page's own, carried in its `#fa-rail` block. */
export interface RailPage {
  /** The shared data's name, `rail-<hash>`. */
  data: string;
  /** Back to the page's own site root — home is the page's site's. */
  toRoot: string;
  /** Back to the platform's site root, where the shared links point. */
  root: string;
  here?: string;
  documentIndex?: NavGroup;
}

/** cyrb53 — a short, stable, dependency-free name for shared content. Not security. */
function contentHash(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** The shared data as text, with the caller's root replaced by {@link RAIL_ROOT}. */
export function railSharedJson(o: RailOptions, root: string): string {
  const shared: RailShared = {
    instance: o.instance,
    ...(o.mark ? { mark: o.mark } : {}),
    ...(o.root ? { root: o.root } : {}),
    links: o.links,
    ...(o.harnesses ? { harnesses: o.harnesses } : {}),
    ...(o.homeLabel ? { homeLabel: o.homeLabel } : {}),
  };
  // Every root-relative value the caller composed starts `<root>/`; put the
  // placeholder there so the SAME data serves a page at any depth.
  return JSON.stringify(shared).split(`"${root}/`).join(`"${RAIL_ROOT}/`);
}

/** The shared data file's name and its script body. */
export function railDataAsset(json: string): { name: string; file: string; body: string } {
  const name = `rail-${contentHash(json)}`;
  const body = `(self.FaRailData=self.FaRailData||{})[${JSON.stringify(name)}]=${JSON.stringify(json)};\n`;
  return { name, file: `${RAIL_DATA_DIR}/${name}.js`, body };
}

/** The rail's regions for one page, from its shared data — what `navbar.js` runs. */
export function renderRailRegions(sharedJson: string, page: RailPage): string {
  const shared = JSON.parse(sharedJson.split(RAIL_ROOT).join(page.root)) as RailShared;
  // "You are here": the page's own row loses its link (a link to here is a
  // control that does nothing — `state-visualizer.test.ts`).
  const links =
    page.here === undefined
      ? shared.links
      : shared.links.map((item) => {
          if (item.href !== `${page.root}${page.here}`) return item;
          const { href: _here, ...rest } = item;
          return { ...rest, current: true };
        });
  return navbarRegionsHtml(
    railModel({
      ...shared,
      links,
      toRoot: page.toRoot,
      ...(page.documentIndex ? { documentIndex: page.documentIndex } : {}),
    }),
  );
}

const PENDING = 'data-fa-rail="pending"';

/** Inject the page block, the placeholder `<nav>` and the three links; emit the shared data. */
function withSharedRail(html: string, o: RailOptions, root: string, documentIndex: NavGroup | undefined): string | undefined {
  if (html.includes('class="fa-nav"')) return undefined;
  const body = /<body\b[^>]*>/i.exec(html);
  if (!body) return undefined;
  const asset = railDataAsset(railSharedJson(o, root));
  o.emitRailData!(asset.file, asset.body);
  const page = { data: asset.name, ...(o.here ? { here: o.here } : {}), ...(documentIndex ? { documentIndex } : {}) };
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const block =
    `<script type="application/json" id="${RAIL_PAGE_ID}" data-fa-root="${esc(root)}" data-fa-to-root="${esc(o.toRoot)}">` +
    JSON.stringify(page).replace(/</g, "\\u003c") +
    `</script>`;
  // Without script the reader still has a way home rather than a blank strip.
  const nav =
    `<nav class="fa-nav" aria-label="folio-assistant" ${PENDING}>` +
    `<a href="${esc(o.toRoot)}/">${esc(o.homeLabel ?? "folio-assistant")}</a></nav>`;
  const at = body.index + body[0].length;
  let out = html.slice(0, at) + block + nav + html.slice(at);
  const tags =
    `<link rel="stylesheet" href="${root}/${NAVBAR_CSS}">` +
    `<script src="${root}/${asset.file}" defer></script>` +
    `<script src="${root}/${NAVBAR_JS}" defer></script>`;
  const head = /<\/head\s*>/i.exec(out);
  out = head ? out.slice(0, head.index) + tags + out.slice(head.index) : out.slice(0, at) + tags + out.slice(at);
  return out;
}

/** Read a page's own rail block back, or `undefined` when it has none. */
export function railPageOf(html: string): RailPage | undefined {
  const m = new RegExp(`<script type="application/json" id="${RAIL_PAGE_ID}" data-fa-root="([^"]*)" data-fa-to-root="([^"]*)">([^<]*)</script>`).exec(html);
  if (!m) return undefined;
  const unesc = (v: string) => v.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  return { ...(JSON.parse(m[3]!) as Omit<RailPage, "root" | "toRoot">), root: unesc(m[1]!), toRoot: unesc(m[2]!) };
}

/**
 * The page as a browser shows it once `navbar.js` has run — for an AUDIT or a
 * test that reads the rail's markup. `readData(name)` returns the shared JSON.
 * A page with no pending rail is returned unchanged.
 */
export function expandRail(html: string, readData: (name: string) => string | undefined): string {
  if (!html.includes(PENDING)) return html;
  const page = railPageOf(html);
  const json = page ? readData(page.data) : undefined;
  if (!page || json === undefined) return html;
  return html.replace(
    new RegExp(`<nav class="fa-nav" aria-label="folio-assistant" ${PENDING}>[\\s\\S]*?</nav>`),
    `<nav class="fa-nav" aria-label="folio-assistant">${renderRailRegions(json, page)}</nav>`,
  );
}
