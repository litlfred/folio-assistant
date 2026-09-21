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

/** Gutter either side of the glyph column. */
export const RAIL_PAD_PX = 10;
/** The glyph column itself. */
export const RAIL_GLYPH_PX = 20;
/**
 * Width at rest — the icon strip at the far left.
 *
 * DERIVED from the glyph column and its two gutters, so the strip is exactly
 * the icon and nothing else, and it is the same number the stylesheet pads
 * `body` by: stated once so the two cannot disagree and leave the rail either
 * overlapping the page or floating off it.
 *
 * **CLOSED IS NOT GONE, and that distinction cost a round.** Asked to "have it
 * start hidden", I removed the strip entirely and put a launcher on the glass.
 * The owner, looking at it: *"clicking it away completelt disappeared in
 * who-iris. i expected the same behaviour as was in who-iris, that it slides
 * to the far left, icon width thick."* So `hidden` meant CLOSED — slid left to
 * the strip — not absent. The strip is the resting state and it is also the
 * affordance: there is no separate launcher, because the rail is always on
 * screen to be clicked.
 */
export const RAIL_COLLAPSED_PX = RAIL_PAD_PX * 2 + RAIL_GLYPH_PX;
/** Width while open. Overlays rather than reflowing. */
export const RAIL_OPEN_PX = 232;

/**
 * The rail's stylesheet. Scoped to `.fa-rail` so a host page keeps its own.
 *
 * Three ways in, one way back:
 *   - `:hover` opens it while the pointer is on it;
 *   - `:focus-within` opens it for a keyboard;
 *   - the `☰` checks a box and it STAYS open, which is what a touch device
 *     needs, since a tablet has no hover at all;
 *   - the `[x]` unchecks it and the rail slides back to the strip.
 *
 * No JavaScript, because these pages are copied verbatim from instances the
 * harness does not control: injecting a nav into somebody else's document is
 * one claim, injecting script into it is a larger one.
 */
export function railCss(): string {
  return [
    // The page sits beside the strip. Opening OVERLAYS rather than reflowing:
    // a rail that pushed the text right on hover would move every line the
    // reader was looking at.
    `body{padding-left:${RAIL_COLLAPSED_PX}px}`,
    `.fa-rail{position:fixed;top:0;left:0;bottom:0;width:${RAIL_COLLAPSED_PX}px;z-index:2147483000;`,
    // Attached to the glass and fixed, so the page scrolls underneath. Its
    // CONTENTS scroll when they outgrow the window -- without this a long rail
    // has items nothing can reach and no scrollbar to say so.
    `overflow-y:auto;overflow-x:hidden;`,
    `background:#1f2328;color:#e6edf3;transition:width .14s ease;`,
    `font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}`,
    `.fa-rail:hover,.fa-rail:focus-within,.fa-rail:has(.fa-rail-open:checked){width:${RAIL_OPEN_PX}px}`,
    // The control is never seen; the two labels are the interface. Off-screen
    // rather than `display:none`, because a hidden control is not focusable
    // and the keyboard would lose the toggle entirely.
    `.fa-rail-open{position:absolute;left:-9999px;width:1px;height:1px}`,
    `.fa-rail-in{width:${RAIL_OPEN_PX}px;display:flex;flex-direction:column;min-height:100%}`,
    `.fa-rail-top{display:flex;align-items:center;gap:8px;padding:10px ${RAIL_PAD_PX}px;`,
    `border-bottom:1px solid #30363d;cursor:pointer;user-select:none}`,
    `.fa-rail-glyph{flex:0 0 ${RAIL_GLYPH_PX}px;text-align:center;font-size:16px}`,
    `.fa-rail-name{font-weight:600}`,
    `.fa-rail a{display:flex;align-items:center;gap:8px;padding:8px ${RAIL_PAD_PX}px;`,
    `color:#e6edf3;text-decoration:none;white-space:nowrap}`,
    `.fa-rail a:hover{background:#30363d}`,
    `.fa-rail a[aria-current="page"]{background:#30363d;font-weight:600}`,
    `.fa-rail-foot{margin-top:auto;border-top:1px solid #30363d;font-size:12px;opacity:.75}`,
    // THE CLOSE CONTROL. Only while pinned open -- an `[x]` in a 40px strip
    // would be the only thing in it, and would read as a close button for the
    // page rather than for the rail. `sticky` so it survives the inner scroll.
    `.fa-rail-close{display:none}`,
    `.fa-rail:has(.fa-rail-open:checked) .fa-rail-close{position:sticky;top:0;float:right;`,
    `display:flex;align-items:center;justify-content:center;width:26px;height:26px;`,
    `margin:6px 6px 0 0;cursor:pointer;user-select:none;border-radius:4px;`,
    `background:#1f2328;opacity:.75}`,
    `.fa-rail-close:hover{opacity:1}`,
    // Every label is held invisible at rest and revealed by the same three
    // mechanisms that widen the rail. Clipping alone is a geometry argument,
    // and a host stylesheet can move where a label starts without touching
    // these numbers. `opacity` rather than `display:none` -- a screen reader
    // should still reach them, and this rail is the only harness navigation
    // these pages have.
    `.fa-rail-label{white-space:nowrap;opacity:0;transition:opacity .12s ease}`,
    `.fa-rail:hover .fa-rail-label,.fa-rail:focus-within .fa-rail-label,`,
    `.fa-rail:has(.fa-rail-open:checked) .fa-rail-label{opacity:1}`,
    `@media print{.fa-rail{display:none}body{padding-left:0}}`,
    `.fa-rail-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
  ].join("");
}

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
    // Both labels drive ONE checkbox, so open and close cannot disagree. All
    // three live inside the rail because the rail is always on screen -- the
    // strip IS the launcher, which is the correction this markup carries.
    `<input type="checkbox" class="fa-rail-open" id="fa-rail-open">` +
    `<label class="fa-rail-close" for="fa-rail-open" title="Close the harness navigation">` +
    `<span aria-hidden="true">&times;</span>` +
    `<span class="fa-rail-sr">Close the harness navigation</span></label>` +
    `<div class="fa-rail-in">` +
    `<label class="fa-rail-top" for="fa-rail-open" title="Open the harness navigation">` +
    `<span class="fa-rail-glyph" aria-hidden="true">&#9776;</span>` +
    `<span class="fa-rail-name fa-rail-label">${esc(o.instance)}</span></label>` +
    items +
    `<a class="fa-rail-foot" href="${esc(o.toRoot)}/">` +
    `<span class="fa-rail-glyph" aria-hidden="true">&#8962;</span>` +
    `<span class="fa-rail-label">folio-assistant</span></a>` +
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
