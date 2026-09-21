/**
 * The harness's left-hand rail, injected into pages Jekyll never sees.
 *
 * ## Why a mounted page has no sidebar at all
 *
 * `mount-instance-docs.ts` copies finished HTML and deliberately does not run
 * Jekyll over it — its own note says handing these to Jekyll "would ask for
 * front matter they do not have and **a layout they do not want**". That is
 * right: `who-iris/` is a replica of IRIS, and just-the-docs' layout would
 * replace IRIS's chrome with folio-assistant's, which is the opposite of what
 * a replica is for.
 *
 * The cost was that the harness disappeared entirely. Measured on the
 * published site, 2026-09-21: `index.html` at the root carries `side-bar` and
 * `nav-list`; `/who-iris/index.html` carries neither, and neither does
 * `/smart-trust/`. **Every mounted instance, not one of them.**
 *
 * The owner's instruction settles the shape rather than the mechanism:
 *
 * > *"f-a navbar should still be on the left, with who-iris and then link to
 * > docs on side in navbar"* — and later, *"it can start collapsed (so only
 * > icon width wide), hovering/clicking on it will open"*.
 *
 * So the rail is the harness's frame **around** the instance's page, never
 * instead of it. Collapsed it costs one icon of width; open it overlays,
 * because a rail that reflowed the page on hover would make the replica jump
 * under the pointer.
 *
 * ## It lives in the MOUNT layer, not in a folio's generator
 *
 * `who-iris/scripts/gen-iris-pages.ts` could emit this, and then `smart-trust`
 * would need its own copy, and so would the next instance. The navbar is the
 * harness's, the page is the folio's, and this is the seam between them — the
 * same platform/folio line `AGENTS.md` opens with.
 *
 * ## No JavaScript
 *
 * `:hover` opens it, `:focus-within` opens it for a keyboard, and a checkbox
 * pins it open for a click. Three mechanisms, no script — which matters
 * because these pages are copied verbatim from instances the harness does not
 * control, and injecting script into somebody else's document is a larger
 * claim than injecting a nav.
 */

/** One destination in the rail. */
export interface RailLink {
  /** Where it goes, already relative to the page being injected. */
  href: string;
  /** What it is called. */
  label: string;
  /** A single character or short glyph shown while collapsed. */
  icon: string;
  /** True for the route the current page belongs to. */
  current?: boolean;
}

export interface RailOptions {
  /** The instance whose page this is, for the rail's heading. */
  instance: string;
  /** Path back to the site root from this page — `..`, `../..`, … */
  toRoot: string;
  /** Everything the rail offers, in the order it offers it. */
  links: readonly RailLink[];
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gutter either side of the glyph column, and the rail's only horizontal padding. */
export const RAIL_PAD_PX = 10;
/** The glyph column itself. */
export const RAIL_GLYPH_PX = 20;
/**
 * Width while collapsed. DERIVED from the glyph column and its two gutters, so
 * the collapsed rail is exactly the icon and nothing else — and it is the same
 * number the stylesheet pads `body` by, stated once so the two cannot disagree
 * and leave the rail either overlapping the page or floating off it.
 *
 * It was a bare 48 until the owner photographed it: at 48 the rail is wider
 * than the glyph column it contains, so the first few pixels of every LABEL
 * sat inside the clip and each row showed a sliver of a word. That reads as a
 * rail that failed to collapse rather than as one collapsed by design, which
 * is what "hidden width too wide" named.
 *
 * Deriving the width is only half the fix. Clipping is a geometry argument,
 * and a geometry argument is one host stylesheet away from being wrong — a
 * larger font, a wider glyph, an inherited `letter-spacing` all move where the
 * label starts while this constant stays put. So the labels are ALSO held at
 * `opacity:0` while collapsed, which cannot be knocked out by arithmetic.
 * Opacity rather than `display:none` or `visibility:hidden` on purpose: the
 * labels stay in the accessibility tree, and this rail is the only harness
 * navigation a mounted page has.
 */
export const RAIL_COLLAPSED_PX = RAIL_PAD_PX * 2 + RAIL_GLYPH_PX;
/** Width while open. Overlays rather than reflowing. */
export const RAIL_OPEN_PX = 232;

/** The rail's stylesheet. Scoped to `.fa-rail` so a host page keeps its own. */
export function railCss(): string {
  return [
    `body{padding-left:${RAIL_COLLAPSED_PX}px}`,
    `.fa-rail{position:fixed;top:0;left:0;bottom:0;width:${RAIL_COLLAPSED_PX}px;z-index:2147483000;`,
    `background:#1f2328;color:#e6edf3;overflow:hidden;transition:width .14s ease;`,
    `font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}`,
    `.fa-rail:hover,.fa-rail:focus-within{width:${RAIL_OPEN_PX}px}`,
    `.fa-rail input.fa-rail-pin{position:absolute;opacity:0;pointer-events:none}`,
    `.fa-rail input.fa-rail-pin:checked~.fa-rail-in{width:${RAIL_OPEN_PX}px}`,
    `.fa-rail-in{width:${RAIL_OPEN_PX}px;display:flex;flex-direction:column;height:100%}`,
    `.fa-rail-top{display:flex;align-items:center;gap:8px;padding:10px ${RAIL_PAD_PX}px;`,
    `border-bottom:1px solid #30363d;cursor:pointer;user-select:none}`,
    `.fa-rail-glyph{flex:0 0 ${RAIL_GLYPH_PX}px;text-align:center;font-size:16px}`,
    `.fa-rail-name{font-weight:600}`,
    `.fa-rail a{display:flex;align-items:center;gap:8px;padding:8px ${RAIL_PAD_PX}px;`,
    `color:#e6edf3;text-decoration:none;white-space:nowrap}`,
    // Every label is held invisible while collapsed and revealed by the same
    // three mechanisms that widen the rail. See RAIL_COLLAPSED_PX: clipping
    // alone is a geometry argument, and a host stylesheet can move where a
    // label starts without touching these numbers. `opacity` rather than
    // `display:none` or `visibility:hidden` -- a screen reader should still
    // reach them, and this rail is the only harness navigation these pages
    // have.
    `.fa-rail-label{white-space:nowrap;opacity:0;transition:opacity .12s ease}`,
    `.fa-rail:hover .fa-rail-label,.fa-rail:focus-within .fa-rail-label,`,
    `.fa-rail .fa-rail-pin:checked~.fa-rail-in .fa-rail-label{opacity:1}`,
    `.fa-rail a:hover{background:#30363d}`,
    `.fa-rail a[aria-current="page"]{background:#30363d;font-weight:600}`,
    `.fa-rail-foot{margin-top:auto;border-top:1px solid #30363d;font-size:12px;opacity:.75}`,
    `@media print{.fa-rail{display:none}body{padding-left:0}}`,
  ].join("");
}

/**
 * The rail itself.
 *
 * `aria-label` rather than a heading element: this is injected into a document
 * that already has its own outline, and inserting an `h1`/`h2` would edit that
 * outline rather than sit beside it.
 */
export function railHtml(o: RailOptions): string {
  const items = o.links
    .map(
      (l) =>
        `<a href="${esc(l.href)}"${l.current ? ' aria-current="page"' : ""}>` +
        `<span class="fa-rail-glyph" aria-hidden="true">${esc(l.icon)}</span>` +
        `<span class="fa-rail-label">${esc(l.label)}</span></a>`,
    )
    .join("");
  return (
    `<nav class="fa-rail" aria-label="folio-assistant">` +
    `<input type="checkbox" class="fa-rail-pin" id="fa-rail-pin" aria-label="Keep the harness navigation open">` +
    `<div class="fa-rail-in">` +
    `<label class="fa-rail-top" for="fa-rail-pin">` +
    `<span class="fa-rail-glyph" aria-hidden="true">☰</span>` +
    `<span class="fa-rail-name fa-rail-label">${esc(o.instance)}</span></label>` +
    items +
    `<a class="fa-rail-foot" href="${esc(o.toRoot)}/">` +
    `<span class="fa-rail-glyph" aria-hidden="true">⌂</span><span class="fa-rail-label">folio-assistant</span></a>` +
    `</div></nav>`
  );
}

/**
 * Put the rail into a finished document.
 *
 * Inserted after the opening `<body>` so it precedes the page's own content in
 * the DOM, which is what a keyboard reaches first.
 *
 * **Returns the html unchanged when there is no `<body>`, and says so by
 * returning `undefined` rather than by silently passing it through.** A
 * fragment, a redirect stub or a file that is HTML only by extension is not a
 * page this rail belongs on, and a caller that could not tell the difference
 * would report a page injected that was not.
 */
export function injectRail(html: string, o: RailOptions): string | undefined {
  if (html.includes('class="fa-rail"')) return undefined; // already carries one
  const body = /<body\b[^>]*>/i.exec(html);
  if (!body) return undefined;
  const at = body.index + body[0].length;
  const style = `<style>${railCss()}</style>`;
  return html.slice(0, at) + style + railHtml(o) + html.slice(at);
}
