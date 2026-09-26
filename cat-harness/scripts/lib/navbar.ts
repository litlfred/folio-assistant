/**
 * ONE navbar, for a Jekyll page and for a mounted page alike.
 *
 * ## Why this module exists at all
 *
 * Owner, 2026-09-21, looking at the who-iris rail working: *"we should have
 * same navbar across all folios though. presented same way. need to comine
 * the two."*
 *
 * There were two. `harness-rail.ts` injected one into pages Jekyll never sees;
 * `docs-ui.css` plus `nav_footer_custom.html` styled the theme's own sidebar.
 * Across three rounds of `hw9g` they were brought to the same BEHAVIOUR — a
 * strip at rest, hover or `☰` to open, `[x]` to close, an inner scroll — by
 * being edited in parallel, twice, with every number derived separately on
 * each side and a test on each asserting its own copy.
 *
 * **That is two implementations agreeing by maintenance, and the agreement has
 * to be re-bought on every change.** This module is where it stops being
 * bought.
 *
 * ## Three regions, and the middle one is the only one that scrolls
 *
 * The owner's layout, and it is structural rather than a styling convention:
 *
 * | region | holds | scrolls |
 * |---|---|---|
 * | `top` | the instance, its `[x]`, and the open document's index when there is one | no |
 * | `graphs` | this KG's own content — `docs/`, `library/`, every declared kind that HAS content | **yes** |
 * | `bottom` | the instantiated harnesses, expandable, each with its avatar; then home | no |
 *
 * *"KG libraries is a scrollable stacks between fixed top an bottom parts"*.
 * So the flex column is `0 0 auto` / `1 1 auto` + `overflow-y:auto` / `0 0
 * auto`, and the two fixed regions cannot be scrolled off. A navbar whose
 * `[x]` scrolls away is one you cannot close from the bottom of a long list.
 *
 * ## A MODEL, not a markup composer
 *
 * The caller builds `NavbarModel` and this renders it. That is what makes one
 * component possible: the rail's regions come from the mount table, the
 * sidebar's will come from Jekyll and the declaration, and neither difference
 * reaches the markup. A renderer that branched on "am I a rail or a sidebar"
 * would be the two implementations again with one import.
 *
 * ## What is NOT here, deliberately
 *
 * The harness **avatars and themes** are `603s`'s, in flight on PR #791. This
 * module takes an avatar if the model supplies one and falls back to an
 * initial otherwise; it mints none and knows no theme. When #791 lands, its
 * avatars arrive through the model and nothing here changes — which is the
 * test of whether this boundary was drawn in the right place.
 *
 * @module scripts/lib/navbar
 */

import {
  NAV_COLLAPSED_PX,
  NAV_MARK_PX as NAV_GLYPH_PX,
  NAV_OPEN_PX,
  NAV_OPEN_WIDE_PX,
  NAV_PAD_PX,
  NAV_WIDE_MQ_PX,
} from "./navbar-geometry.js";

/** One destination. */
export interface NavItem {
  /** Where it goes, already relative to the page being rendered. */
  href?: string;
  /** What it is called. */
  label: string;
  /** A single character or short glyph, shown while the navbar rests. */
  icon?: string;
  /**
   * An image to use instead of `icon` — the harness's avatar, when it has one.
   *
   * `region` is the image's declared `avatarRegion` (`603s`), as fractions of
   * the image: the part of the art that IS the avatar. Optional, because most
   * marks are already a mark — an icon that fills its own frame needs no crop,
   * and cropping one would be inventing a box nobody measured.
   */
  avatar?: { src: string; title?: string; region?: { x: number; y: number; w: number; h: number } };
  /** A hue for the item's mark, 0–360. `603s`'s `tone`. */
  tone?: number;
  /** True for the route the current page belongs to. */
  current?: boolean;
  /**
   * Nesting under the item above it — 0 or absent for a top-level row.
   *
   * Only the document index uses it today. It is on `NavItem` rather than in
   * that function because a *rendered* indent is the renderer's business: a
   * caller that returned pre-indented labels would be composing markup, which
   * is the thing this module exists to stop callers doing.
   */
  depth?: number;
  /**
   * WHY this row does not open, shown as text beside the label.
   *
   * Only meaningful with no {@link href} — a row that opens owes no
   * explanation — and the wording is the CALLER's, because only the caller
   * knows which of the several reasons applies. `harness-tiles` separates
   * four of them (`HarnessVisualisation.note`) and this renderer picks none
   * of them.
   *
   * ## Why text, and not `title` or `aria-disabled`
   *
   * The Jekyll sidebar reached this row first and said it with
   * `title="declared, with no published viewer"` on a `<span>`. A `<span>` is
   * not focusable, so that label has NO KEYBOARD PATH at all, and `title` on
   * a non-interactive element is not reliably announced — so the surface that
   * did say it said it to a pointer and to nothing else. This rail said
   * nothing whatever: `opacity:.55` and no words, which is state carried by
   * contrast alone. Both are `gjli`.
   *
   * Real text has neither problem and needs no ARIA to fix: it is in the
   * accessibility tree because it is content, it survives a stylesheet that
   * does not load, and it is not a second signal that can disagree with the
   * first. `aria-disabled` was the other candidate and is wrong here for a
   * plainer reason — nothing is disabled. There is no control. A `<span>`
   * marked `aria-disabled` announces a disabled widget that does not exist,
   * which is the "inert row reading as a control" failure rather than a fix
   * for it.
   */
  note?: string;
  /**
   * Rows nested UNDER this one — a harness's own graphs, under the harness.
   *
   * The Jekyll sidebar has rendered these since `603s` (`.fa-harness-tab__graphs`)
   * and this rail never has, which is the single largest difference between the
   * two surfaces: the sidebar lets a reader reach `who-iris/library/` from the
   * harness row, and the rail stops at the harness. `sjic` calls that *"two
   * implementations of one navbar, disagreeing about whether a reader can reach
   * a graph"*.
   *
   * It is on `NavItem` rather than expressed as a nested {@link NavGroup}
   * because these rows are not a group: they have no label of their own, they
   * do not collapse separately, and they belong to the row above them. A group
   * would give each harness a second disclosure inside the harnesses
   * disclosure, which is a shape nobody asked for.
   */
  children?: readonly NavItem[];
  /**
   * A control rendered BESIDE the row — never inside it.
   *
   * The sidebar's ⚙ opens the glass's Harnesses panel with this harness chosen
   * (#1146). Its own comment says why it is a sibling: *"the tab is a link, and
   * a control nested in a link is two targets a keyboard cannot tell apart."*
   *
   * `data` is the attribute the page's delegation reads. With no script it does
   * nothing and the row still works, so a surface that ships no script simply
   * declares no action rather than rendering a dead control.
   */
  action?: { readonly data: string; readonly value: string; readonly label: string; readonly glyph: string };
}

/** A labelled group of items, which may be collapsed behind a disclosure. */
export interface NavGroup {
  label: string;
  icon?: string;
  items: readonly NavItem[];
  /**
   * Render as a `<details>` the reader opens.
   *
   * The owner's "exploding menu from folio-assisnt" — and `<details>` rather
   * than a scripted disclosure for the reason `nav_footer_custom.html` already
   * records: keyboard-operable, announces its own state, and works with no
   * script at all, which matters because this IS navigation.
   */
  collapsible?: boolean;
  /** Open on arrival. Only meaningful with `collapsible`. */
  open?: boolean;
}

export interface NavbarModel {
  /** The instance this navbar belongs to, shown in the fixed top. */
  instance: string;
  /**
   * The instance's own themed root — its front door, in the fixed top.
   *
   * NOT inside the graphs group: a group labelled "Graphs" that contains the
   * instance itself is a label that does not tell the truth, and the root is
   * the one destination that should stay reachable when the graphs are folded
   * away. The `☰` header beside it is a TOGGLE, not a link, so this is the
   * only way to the instance's front page from a page beneath it.
   */
  root?: NavItem;
  /**
   * The open document's index, when a document is open.
   *
   * *"when a document or other indexed object is opened, the document
   * index/idices are shown in a navbar tab/menu"*. It sits in the FIXED top
   * with the instance, not in the scrollable middle, because it is about the
   * thing the reader is looking at rather than about the graph they are in.
   * `undefined` when nothing is open, and the region is then absent rather
   * than empty — an empty disclosure invites a click that does nothing.
   */
  documentIndex?: NavGroup;
  /**
   * The KG's own graphs — the scrollable middle, as ONE collapsible group.
   *
   * Owner, 2026-09-21: *"librarues should be in hambuger menu so can collase
   * all"*. A group rather than a bare list, so the whole stack folds in one
   * click; `open: true` so the default is to show it, because a navbar whose
   * content arrives folded is a navbar that looks empty.
   *
   * *"there shuold be all the harness controlled dirs/graphs"* — EVERY
   * declared graph, not only the ones with a viewer. A graph with no published
   * viewer appears with no href, which `harness-tiles` already words exactly
   * right: **declared and not rendered is a gap, not a dead link.** Omitting it
   * would answer "what is in this KG" with a shorter and wronger list.
   *
   * **Absent only when another navigation already owns the middle region.**
   * That is true on exactly one surface — the Jekyll theme renders its own
   * `<nav id="site-nav">` page tree there — and it is why this became optional
   * rather than being satisfied with an empty group: an empty `<details>`
   * invites a click that does nothing, which is the rule the rest of this
   * module follows for a row with no destination.
   */
  graphs?: NavGroup;
  /** The instantiated harnesses. The expandable group in the fixed bottom. */
  harnesses?: NavGroup;
  /** Home, last in the fixed bottom. `"keep home at bottom for who iris."` */
  home?: NavItem;
  /**
   * HOW an href is written — the difference between the two surfaces, DECLARED.
   *
   * `sjic`'s last box asks for one renderer for a Jekyll page and a mounted
   * page *"with the difference DECLARED rather than branched on"*. This is one
   * of the two things that actually differ, and it is a property of the
   * SURFACE rather than of any row, which is why it sits on the model and not
   * on {@link NavItem}.
   *
   * - `"resolved"` (the default) — the caller has already made the href
   *   relative to the page being rendered. That is what every injected rail
   *   does: `railModel` composes `toRoot` and the page knows where it is.
   * - `"liquid"` — the href is site-root-relative and is emitted wrapped in
   *   Jekyll's `relative_url` filter, which applies the baseurl at build time.
   *   A Jekyll page cannot use a resolved href: the same include is rendered
   *   into pages at every depth, and the site is served from `/folio-assistant/`
   *   on the canonical deploy and from `/folio-assistant/STAGING/<branch>/` on a
   *   preview. `68au` is what omitting the filter costs — every graph tile in
   *   the navbar 404'd.
   *
   * Emitting a Liquid filter from a TypeScript renderer is not a new idea
   * here: `docs/_includes/generated/todo-listing.html` is generated, gated by
   * a `--check`, and emits `{{ '…' | relative_url }}` for exactly this reason.
   */
  hrefs?: "resolved" | "liquid";
  /**
   * Whether this rendering emits the open checkbox, or only labels for one
   * rendered elsewhere on the same page.
   *
   * The third declared difference, and the only one that is about a surface
   * rendering the navbar MORE THAN ONCE. An injected rail is written into a
   * page exactly once, so it always carries its own input; just-the-docs
   * includes its footer extension point twice per page by design, so the
   * second copy must render `"labels"`. See {@link navbarRegionsHtml} for what
   * the duplicate cost and why giving the second copy its own id was worse.
   */
  openControl?: "input" | "labels";
}

/** How a rendering pass writes its hrefs. Threaded rather than global. */
interface Ctx {
  readonly liquid: boolean;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * One href, written the way this surface declares.
 *
 * The Liquid form is single-quoted because a path may contain a double quote
 * only if somebody has gone badly wrong upstream, and `esc` has already turned
 * `"` into `&quot;` by the time this runs — so the quote that delimits the
 * filter's argument cannot be the one that closes the attribute.
 */
const href = (path: string, c: Ctx): string =>
  c.liquid ? `{{ '${esc(path)}' | relative_url }}` : esc(path);

/**
 * THE GEOMETRY IS NOT DECIDED HERE ANY MORE.
 *
 * It was, and `docs-ui.css` decided it again, separately — 40px against 56px
 * at rest and 232px against 248px open, on two navbars the owner had asked to
 * be "presented same way". `lib/navbar-geometry.ts` is the single record and
 * carries the whole argument for whose numbers won.
 *
 * `NAV_GLYPH_PX` is kept as the name callers already import; the record calls
 * the same column `markPx`, because it holds an avatar as often as a glyph.
 */
export {
  NAV_COLLAPSED_PX,
  NAV_OPEN_PX,
  NAV_OPEN_WIDE_PX,
  NAV_PAD_PX,
  NAV_WIDE_MQ_PX,
} from "./navbar-geometry.js";
export { NAV_MARK_PX as NAV_GLYPH_PX } from "./navbar-geometry.js";

/**
 * The navbar's stylesheet, scoped to `.fa-nav` so a host page keeps its own.
 *
 * Three ways in, one way back: `:hover` while the pointer is on it,
 * `:focus-within` for a keyboard, and the `☰` which checks a box so it STAYS
 * open — which is what a touch device needs, having no hover at all. The `[x]`
 * unchecks it. `board-windows`' `l4zi`: an action whose inverse is not
 * reachable is not a toggle.
 *
 * No JavaScript. On a mounted page that is not a preference: those documents
 * are copied verbatim from instances the harness does not control, and
 * injecting a nav into somebody else's page is one claim while injecting
 * script into it is a larger one.
 */
export function navbarCss(): string {
  return [
    // The page sits beside the strip; opening OVERLAYS rather than reflowing,
    // or every line the reader was looking at moves.
    `body{padding-left:${NAV_COLLAPSED_PX}px}`,
    `.fa-nav{position:fixed;top:0;left:0;bottom:0;width:${NAV_COLLAPSED_PX}px;z-index:2147483000;`,
    `background:#1f2328;color:#e6edf3;overflow:hidden;transition:width .14s ease;`,
    `font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}`,
    `.fa-nav:hover,.fa-nav:focus-within,.fa-nav:has(.fa-nav-open:checked){width:${NAV_OPEN_PX}px}`,
    // The folio handle, placed IN this rail by docs-ui.js (owner, 2026-09-24:
    // "folio handle on LHS on navbar"). At rest the strip shows marks only, so
    // its label waits for the rail to open, as every other label here does.
    `.fa-nav:not(:hover):not(:focus-within):not(:has(.fa-nav-open:checked)) .fa-glass-handle__label{opacity:0}`,
    // The theme widens its own sidebar at `mq(lg)` with a `min-width` FLOOR.
    // The rail has no such floor and would simply stay narrower -- which is
    // the same navbar at two widths on one screen size, the defect this
    // whole module exists to have ended.
    `@media(min-width:${NAV_WIDE_MQ_PX}px){`,
    `.fa-nav:hover,.fa-nav:focus-within,.fa-nav:has(.fa-nav-open:checked){width:${NAV_OPEN_WIDE_PX}px}`,
    `.fa-nav-in{width:${NAV_OPEN_WIDE_PX}px}}`,
    // Clipped in place, never parked at `left:-9999px`: on a right-to-left
    // page that is the scrollable side, and it widened the page ~10,000px
    // (bean `2r2n`). Same rule as `.fa-nav-open` in docs-ui.css.
    `.fa-nav-open{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`,
    // THE THREE REGIONS. `min-height:0` on the middle is not optional: a flex
    // child defaults to `min-height:auto`, which refuses to shrink below its
    // content, so the column grows past the viewport and the FIXED BOTTOM
    // scrolls off the screen -- taking the harnesses and home with it.
    `.fa-nav-in{width:${NAV_OPEN_PX}px;height:100%;display:flex;flex-direction:column}`,
    `.fa-nav-top{flex:0 0 auto}`,
    `.fa-nav-graphs{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden}`,
    `.fa-nav-bottom{flex:0 0 auto;border-top:1px solid #30363d}`,
    `.fa-nav-head{display:flex;align-items:center;gap:8px;padding:10px ${NAV_PAD_PX}px;`,
    `border-bottom:1px solid #30363d;cursor:pointer;user-select:none}`,
    `.fa-nav-glyph{flex:0 0 ${NAV_GLYPH_PX}px;text-align:center;font-size:16px}`,
    `.fa-nav-glyph img{width:${NAV_GLYPH_PX}px;height:${NAV_GLYPH_PX}px;display:block}`,
    // A CROPPED mark: the frame clips and the image is positioned inside it.
    // The `img` rule above sizes an UNCROPPED avatar; a cropped one carries
    // its own width/height inline, so this resets the two that would fight it.
    `.fa-nav-crop{position:relative;overflow:hidden;height:${NAV_GLYPH_PX}px}`,
    `.fa-nav-crop img{position:absolute;width:auto;height:auto;max-width:none}`,
    `.fa-nav-name{font-weight:600}`,
    `.fa-nav a{display:flex;align-items:center;gap:8px;padding:8px ${NAV_PAD_PX}px;`,
    `color:#e6edf3;text-decoration:none;white-space:nowrap}`,
    `.fa-nav a:hover{background:#30363d}`,
    `.fa-nav a[aria-current="page"]{background:#30363d;font-weight:600}`,
    // An item with nowhere to go is NOT a link -- `pb04`: a dead link is worse
    // than no link, because it invites a click and then reads as broken.
    // THE DIM STAYS, AND IT WAS NEVER THE PROBLEM. `opacity:.55` over
    // `#1f2328` composites `#e6edf3` to `(140,146,152)`, which is 5.03:1 --
    // measured, and clear of 4.5:1. The first version of this comment claimed
    // it failed; it does not, and the fault is the other one: the dim was the
    // ONLY signal, so "declared and not built" was carried by contrast alone
    // with no words anywhere on this surface. `.fa-nav-note` is the words.
    // `cursor:default` so the pointer does not promise a click either.
    `.fa-nav-dead{display:flex;align-items:center;gap:8px;padding:8px ${NAV_PAD_PX}px;`,
    `opacity:.55;cursor:default}`,
    // The reason sits BESIDE the label, not under it: the strip is one row per
    // item, and a second line would make these the only rows in the navbar
    // with a different height. At 11px it is small text, so it needs 4.5:1 in
    // its own right -- which it has, being the same composited ink as the
    // label it sits next to.
    `.fa-nav-note{margin-left:auto;font-size:11px;font-style:italic;white-space:nowrap}`,
    // A ROW WITH A CONTROL, and its children beneath both.
    //
    // `grid` rather than flex because the row and its control share one line
    // while the children take a full-width second one, and that is a
    // two-dimensional statement. With flex it would be a wrap the browser
    // happens to make, which is the same layout only while the labels are
    // short.
    //
    // The control's column is `auto`, so a row with no control has no reserved
    // gutter — the collapsed strip is `NAV_COLLAPSED_PX` wide and a reserved
    // column it never uses is a strip that is narrower than it looks.
    `.fa-nav-row{display:grid;grid-template-columns:1fr auto;align-items:center}`,
    `.fa-nav-row>a,.fa-nav-row>.fa-nav-dead{min-width:0}`,
    `.fa-nav-kids{grid-column:1/-1}`,
    // The control is hidden with the labels rather than on its own timer: at
    // rest the strip shows marks only, and a ⚙ floating beside a mark with no
    // label names nothing. Same trigger as `.fa-nav-label`, so the two cannot
    // disagree about when the navbar is open.
    `.fa-nav-action{display:none;background:none;border:0;cursor:pointer;`,
    `padding:0 ${NAV_PAD_PX}px;font-size:13px;line-height:1;color:inherit;opacity:.7}`,
    `.fa-nav-action:hover,.fa-nav-action:focus-visible{opacity:1}`,
    `.fa-nav:hover .fa-nav-action,.fa-nav:focus-within .fa-nav-action,`,
    `.fa-nav:has(.fa-nav-open:checked) .fa-nav-action{display:block}`,
    // THE EXPLODING MENU. `<details>` so it is keyboard-operable and announces
    // its own state with no script.
    `.fa-nav-group>summary{display:flex;align-items:center;gap:8px;padding:8px ${NAV_PAD_PX}px;`,
    `cursor:pointer;user-select:none;list-style:none}`,
    `.fa-nav-group>summary::-webkit-details-marker{display:none}`,
    `.fa-nav-group>summary:hover{background:#30363d}`,
    `.fa-nav-group[open]>summary{font-weight:600}`,
    `.fa-nav-group .fa-nav-sub a{padding-left:${NAV_PAD_PX + NAV_GLYPH_PX + 8}px}`,
    `.fa-nav-tone{border-radius:3px}`,
    // THE CLOSE CONTROL, only while pinned open. Alone in a strip this narrow
    // it would be the only thing in it, and would read as a close button for
    // the PAGE rather than for the navbar.
    `.fa-nav-close{display:none}`,
    `.fa-nav:has(.fa-nav-open:checked) .fa-nav-close{position:sticky;top:0;float:right;`,
    `display:flex;align-items:center;justify-content:center;width:26px;height:26px;`,
    `margin:6px 6px 0 0;cursor:pointer;user-select:none;border-radius:4px;`,
    `background:#1f2328;opacity:.75}`,
    `.fa-nav-close:hover{opacity:1}`,
    // Labels are held invisible at rest rather than merely clipped: clipping
    // is a geometry argument, and a host stylesheet moves where a label starts
    // without touching any of these numbers. `opacity`, not `display:none` --
    // a screen reader should still reach them.
    `.fa-nav-label{white-space:nowrap;opacity:0;transition:opacity .12s ease}`,
    `.fa-nav:hover .fa-nav-label,.fa-nav:focus-within .fa-nav-label,`,
    `.fa-nav:has(.fa-nav-open:checked) .fa-nav-label{opacity:1}`,
    `@media print{.fa-nav{display:none}body{padding-left:0}}`,
    `.fa-nav-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
  ].join("");
}

/** An item's mark: its avatar when it has one, its glyph otherwise. */
function mark(i: NavItem, c: Ctx): string {
  const tone = i.tone ? ` style="background:hsl(${i.tone} 45% 28%)"` : "";
  if (i.avatar) {
    const t = i.avatar.title ? ` title="${esc(i.avatar.title)}"` : "";
    const r = i.avatar.region;
    if (!r) {
      return (
        `<span class="fa-nav-glyph fa-nav-tone"${tone}>` +
        `<img src="${href(i.avatar.src, c)}" alt=""${t}></span>`
      );
    }
    // THE CROP, and the arithmetic is `603s`'s. The frame shows `r` scaled to
    // fill it, so the IMAGE is scaled by `1/w` and `1/h` and then offset by
    // `-x` and `-y` OF THE SCALED image — which is why the offsets divide by
    // the same fractions. Percentages rather than pixels so the mark resizes
    // with `NAV_GLYPH_PX` and this never has to agree with a number again.
    //
    // `1/w` and `1/h` are applied SEPARATELY, which is exactly why
    // `KgImageSchema` refuses a non-square box in PIXELS: on a landscape image
    // equal fractions are not a square region, and the two scales then stretch
    // the art by `w/h`. The schema is the guard; this is the code it guards.
    const pct = (n: number) => `${+(n * 100).toFixed(4)}%`;
    return (
      `<span class="fa-nav-glyph fa-nav-tone fa-nav-crop"${tone}>` +
      `<img src="${href(i.avatar.src, c)}" alt=""${t} style="` +
      `width:${pct(1 / r.w)};height:${pct(1 / r.h)};` +
      `left:${pct(-r.x / r.w)};top:${pct(-r.y / r.h)}"></span>`
    );
  }
  // An initial, not a question mark. `603s` reports "no avatar declared" as a
  // FINDING elsewhere; a navbar is not the place to render a gap as a glyph.
  const glyph = i.icon ?? i.label.slice(0, 1).toUpperCase();
  return `<span class="fa-nav-glyph fa-nav-tone"${tone} aria-hidden="true">${esc(glyph)}</span>`;
}

function itemHtml(i: NavItem, c: Ctx): string {
  const body = `${mark(i, c)}<span class="fa-nav-label">${esc(i.label)}</span>`;
  // Indent by PADDING rather than by a nested list: a nested `<ul>` would make
  // the document index a different shape from every other group here, and the
  // rows are links either way.
  const d = i.depth && i.depth > 0 ? ` style="padding-left:${NAV_PAD_PX + (NAV_GLYPH_PX + 8) * i.depth}px"` : "";
  let row: string;
  if (i.href === undefined) {
    // The note is part of the row's TEXT, inside the same element, so an
    // assistive technology reads "catalogue, no viewer yet" as one thing
    // rather than as a label and a detached aside.
    const note = i.note ? `<span class="fa-nav-note">${esc(i.note)}</span>` : "";
    row = `<span class="fa-nav-dead"${d}>${body}${note}</span>`;
  } else {
    row = `<a href="${href(i.href, c)}"${d}${i.current ? ' aria-current="page"' : ""}>${body}</a>`;
  }
  if (!i.action && !i.children) return row;
  // The action is a SIBLING of the row, never inside it — a control nested in
  // a link is two targets a keyboard cannot tell apart. The children follow
  // both, so the row and its control stay adjacent in the tab order.
  const action = i.action
    ? `<button type="button" class="fa-nav-action" ${esc(i.action.data)}="${esc(i.action.value)}"` +
      ` aria-label="${esc(i.action.label)}">${esc(i.action.glyph)}</button>`
    : "";
  const kids = i.children?.length
    ? `<div class="fa-nav-kids">${i.children.map((k) => itemHtml(k, c)).join("")}</div>`
    : "";
  // `fa-nav-row` exists so the row and its action can sit on one line without
  // the children joining them. Without it the action would have to be absolutely
  // positioned against a row it is not inside, which is the kind of geometry
  // `navbar-geometry.ts` exists to stop being re-decided.
  return `<div class="fa-nav-row">${row}${action}${kids}</div>`;
}

function groupHtml(g: NavGroup, c: Ctx): string {
  const items = g.items.map((i) => itemHtml(i, c)).join("");
  if (!g.collapsible) return items;
  return (
    `<details class="fa-nav-group"${g.open ? " open" : ""}>` +
    `<summary><span class="fa-nav-glyph" aria-hidden="true">${esc(g.icon ?? "▸")}</span>` +
    `<span class="fa-nav-label">${esc(g.label)}</span></summary>` +
    `<div class="fa-nav-sub">${items}</div></details>`
  );
}

/** The navbar. */
export function navbarHtml(m: NavbarModel): string {
  return `<nav class="fa-nav" aria-label="folio-assistant">${navbarRegionsHtml(m)}</nav>`;
}

/**
 * The navbar's REGIONS, without the `<nav>` element around them.
 *
 * This exists for the one surface that already has its own container: the
 * Jekyll theme renders `.side-bar`, and `nav_footer_custom.html` is
 * just-the-docs' extension point *inside* it. Emitting a second `<nav>` there
 * would give the page two navigation landmarks and put the harness tabs in the
 * wrong one.
 *
 * **This is the second of the two declared differences**, with
 * {@link NavbarModel.hrefs} — and it is a difference in what OWNS the element,
 * not in what is rendered. `navbarHtml` is this function plus a wrapper, so
 * the two surfaces cannot drift: there is no second copy of the region order
 * to keep in step.
 */
export function navbarOpenInputHtml(): string {
  return `<input type="checkbox" class="fa-nav-open" id="fa-nav-open">`;
}

export function navbarRegionsHtml(m: NavbarModel): string {
  const c: Ctx = { liquid: m.hrefs === "liquid" };
  return (
    // One checkbox behind two labels, so open and close cannot disagree.
    //
    // `openControl: "labels"` renders only the labels, for a surface that
    // renders this markup MORE THAN ONCE per page. just-the-docs includes its
    // footer extension point twice by design, and with the input in both,
    // `id="fa-nav-open"` appeared twice on 429 of 1,283 built pages (`uknu`).
    // Giving the second copy its own id was tried and was worse: the
    // stylesheet reads `.side-bar:has(.fa-nav-open:checked)` and the second
    // input is not in `.side-bar`, so it checked a box nothing reads.
    (m.openControl === "labels" ? "" : navbarOpenInputHtml()) +
    `<label class="fa-nav-close" for="fa-nav-open" title="Close navigation">` +
    `<span aria-hidden="true">&times;</span>` +
    `<span class="fa-nav-sr">Close navigation</span></label>` +
    `<div class="fa-nav-in">` +
    `<div class="fa-nav-top">` +
    `<label class="fa-nav-head" for="fa-nav-open" title="Open navigation">` +
    `<span class="fa-nav-glyph" aria-hidden="true">&#9776;</span>` +
    `<span class="fa-nav-name fa-nav-label">${esc(m.instance)}</span></label>` +
    (m.root ? itemHtml(m.root, c) : "") +
    (m.documentIndex ? groupHtml(m.documentIndex, c) : "") +
    `</div>` +
    (m.graphs ? `<div class="fa-nav-graphs">${groupHtml(m.graphs, c)}</div>` : "") +
    `<div class="fa-nav-bottom">` +
    (m.harnesses ? groupHtml(m.harnesses, c) : "") +
    (m.home ? itemHtml(m.home, c) : "") +
    `</div>` +
    `</div>`
  );
}

/**
 * Put the navbar into a finished document.
 *
 * **Returns `undefined` rather than the input when there is no `<body>` or the
 * page already carries one.** A fragment, a redirect stub or a file that is
 * HTML only by extension is not a page this belongs on, and a caller that
 * could not tell the difference would report a page injected that was not.
 */
export function injectNavbar(html: string, m: NavbarModel): string | undefined {
  if (html.includes('class="fa-nav"')) return undefined;
  const body = /<body\b[^>]*>/i.exec(html);
  if (!body) return undefined;
  const at = body.index + body[0].length;
  return html.slice(0, at) + `<style>${navbarCss()}</style>` + navbarHtml(m) + html.slice(at);
}

/**
 * The open document's own index, read off the page it is being injected into.
 *
 * Owner, 2026-09-21: *"when a document or other indexed object is opened, the
 * document index/idices are shown in a navbar tab/menu."* `NavbarModel` has
 * carried `documentIndex` since it was written; **nothing supplied one** — a
 * repo-wide search on 2026-09-22 found the type, the render branch and a
 * single test, so the sentence was unbuilt on both surfaces.
 *
 * ## Only headings the page can actually be scrolled to
 *
 * A heading with no `id` is not a destination, and a fragment link to one goes
 * nowhere. So the `id` is the filter, not the heading level — that is the same
 * `pb04` rule the rest of this module follows: a dead link invites a click and
 * then reads as a broken site. It is also what makes this safe on a document
 * the harness does not control; those pages are copied verbatim and their
 * heading ids are whatever their own generator assigned.
 *
 * ## `h2` and `h3` only
 *
 * `h1` is the document's title, which the reader is already looking at, and
 * the navbar names the instance directly above. Below `h3` an index stops
 * being a way in and becomes the document again — and this region is in the
 * FIXED top, so every row it takes is a row the scrollable middle does not
 * get.
 *
 * `h3`s are nested under the `h2` they follow, which is why they carry
 * `depth`. A flat list of eleven rows where three are subsections of the first
 * is a list that lies about the document's shape.
 *
 * ## Regex rather than a DOM
 *
 * This runs over hundreds of copied files during a mount, and the alternative
 * is a parser dependency in a script whose whole job is string injection. The
 * cost is that it sees `<h2 id>` in a comment or a `<pre>`; the consequence of
 * that is one extra row in a menu, which is why it is an acceptable trade
 * here and would not be in a validator.
 */
export function documentIndexOf(html: string, label = "Contents"): NavGroup | undefined {
  const items: NavItem[] = [];
  const re = /<(h2|h3)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const m of html.matchAll(re)) {
    const text = m[3]
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    items.push({ href: `#${m[2]}`, label: text, ...(m[1].toLowerCase() === "h3" ? { depth: 1 } : {}) });
  }
  // ABSENT rather than empty, and rather than a one-item index. An empty
  // disclosure invites a click that does nothing -- the rule this module
  // already applies to the harnesses region -- and a "Contents" holding the
  // single section the reader is looking at is the same defect with a row in
  // it.
  if (items.length < 2) return undefined;
  return { label, icon: "≡", items, collapsible: true };
}
