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

/** Launcher size, and the gutter it sits in. */
export const RAIL_LAUNCHER_PX = 36;
/**
 * Width while open. Overlays rather than reflowing.
 *
 * There is no collapsed width any more, and that is the change the owner asked
 * for on 2026-09-21: *"have it start hidden. it is attached to
 * screen/window/glass. it does not scroll. need easy way to close it. [x]"*
 *
 * The rail used to collapse to a glyph column — `RAIL_PAD_PX * 2 +
 * RAIL_GLYPH_PX` — and open on `:hover`. **Hidden removes hover as the
 * opener**, because there is nothing on screen to put a pointer on. So the
 * strip is gone, a launcher fixed to the glass opens it, and an `[x]` inside
 * closes it. `board-windows`' `l4zi`: an action whose inverse is not reachable
 * is not a toggle.
 *
 * `body` is no longer padded at all. The page gets its full width while the
 * rail is away, and the open rail overlays it — the same choice the rail
 * always made, and more visible now that closed means closed.
 */
export const RAIL_OPEN_PX = 232;
/** The glyph column inside an open row. */
export const RAIL_GLYPH_PX = 20;
/** Horizontal padding on a row. */
export const RAIL_PAD_PX = 10;

/**
 * The rail's stylesheet. Scoped to `.fa-rail` so a host page keeps its own.
 *
 * `:has()` on `.fa-rail` rather than a sibling combinator, because the
 * launcher and the close control sit at different depths inside it and a
 * combinator would pin the markup's shape into the selector.
 */
export function railCss(): string {
  return [
    // The page keeps its full width. The rail overlays it when open.
    `body{padding-left:0}`,
    `.fa-rail{position:fixed;top:0;left:0;bottom:0;width:${RAIL_OPEN_PX}px;z-index:2147483000;`,
    // HIDDEN TO THE KEYBOARD TOO. `transform` alone leaves every link
    // focusable off-screen, so tabbing walks an invisible nav and the focus
    // ring disappears past the window edge.
    `transform:translateX(-100%);visibility:hidden;`,
    // Attached to the glass and fixed, so the page scrolls underneath. Its
    // CONTENTS scroll when they outgrow the window -- without this a long rail
    // has items nothing can reach and no scrollbar to say so.
    `overflow-y:auto;overflow-x:hidden;`,
    `background:#1f2328;color:#e6edf3;transition:transform .16s ease,visibility .16s;`,
    `font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}`,
    `.fa-rail:has(.fa-rail-open:checked){transform:none;visibility:visible}`,
    // The control is never seen; the two labels are the interface. Off-screen
    // rather than `display:none`, because a hidden control is not focusable
    // and the keyboard would lose the rail entirely.
    `.fa-rail-open{position:absolute;left:-9999px;width:1px;height:1px}`,
    // THE LAUNCHER -- the only thing on screen while the rail is hidden, so it
    // is the whole affordance. It sits OUTSIDE `.fa-rail`, because anything
    // inside a hidden element is hidden with it.
    `.fa-rail-launcher{position:fixed;top:10px;left:10px;z-index:2147483001;`,
    `display:flex;align-items:center;justify-content:center;`,
    `width:${RAIL_LAUNCHER_PX}px;height:${RAIL_LAUNCHER_PX}px;cursor:pointer;user-select:none;`,
    `background:#1f2328;color:#e6edf3;border:1px solid #30363d;border-radius:6px;font-size:16px;line-height:1}`,
    `body:has(.fa-rail-open:checked) .fa-rail-launcher{display:none}`,
    // THE CLOSE CONTROL. `sticky` so it stays reachable after the inner scroll
    // above has moved the rail.
    `.fa-rail-close{position:sticky;top:0;float:right;display:flex;align-items:center;`,
    `justify-content:center;width:28px;height:28px;margin:6px 6px 0 0;cursor:pointer;`,
    `user-select:none;border-radius:4px;background:#1f2328;opacity:.75}`,
    `.fa-rail-close:hover{opacity:1}`,
    `.fa-rail-in{display:flex;flex-direction:column;min-height:100%}`,
    `.fa-rail-top{display:flex;align-items:center;gap:8px;padding:10px ${RAIL_PAD_PX}px;`,
    `border-bottom:1px solid #30363d;user-select:none}`,
    `.fa-rail-glyph{flex:0 0 ${RAIL_GLYPH_PX}px;text-align:center;font-size:16px}`,
    `.fa-rail-name{font-weight:600}`,
    `.fa-rail a{display:flex;align-items:center;gap:8px;padding:8px ${RAIL_PAD_PX}px;`,
    `color:#e6edf3;text-decoration:none;white-space:nowrap}`,
    `.fa-rail a:hover{background:#30363d}`,
    `.fa-rail a[aria-current="page"]{background:#30363d;font-weight:600}`,
    `.fa-rail-foot{margin-top:auto;border-top:1px solid #30363d;font-size:12px;opacity:.75}`,
    // A nav that is not on screen prints nothing useful, and the launcher
    // prints as a stray box.
    `@media print{.fa-rail,.fa-rail-launcher,.fa-rail-close{display:none}body{padding-left:0}}`,
    // The `sr-only` text that names each control. Not `display:none`: the
    // whole point is that a screen reader reads it.
    `.fa-rail-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
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
        `<span>${esc(l.label)}</span></a>`,
    )
    .join("");
  return (
    // THE CONTROL AND THE LAUNCHER SIT OUTSIDE THE RAIL. Anything inside a
    // hidden element is hidden with it, so a launcher in there could never be
    // clicked. `<label for>` reaches a control anywhere in the document, so
    // this `☰` and the `[x]` inside the rail drive ONE checkbox rather than
    // two states free to disagree.
    `<input type="checkbox" class="fa-rail-open" id="fa-rail-open">` +
    `<label class="fa-rail-launcher" for="fa-rail-open" title="Show harness navigation">` +
    `<span aria-hidden="true">&#9776;</span>` +
    `<span class="fa-rail-sr">Show harness navigation</span></label>` +
    `<nav class="fa-rail" aria-label="folio-assistant">` +
    `<label class="fa-rail-close" for="fa-rail-open" title="Hide harness navigation">` +
    `<span aria-hidden="true">&times;</span>` +
    `<span class="fa-rail-sr">Hide harness navigation</span></label>` +
    `<div class="fa-rail-in">` +
    `<div class="fa-rail-top">` +
    `<span class="fa-rail-glyph" aria-hidden="true">&#9776;</span>` +
    `<span class="fa-rail-name">${esc(o.instance)}</span></div>` +
    items +
    `<a class="fa-rail-foot" href="${esc(o.toRoot)}/">` +
    `<span class="fa-rail-glyph" aria-hidden="true">&#8962;</span><span>folio-assistant</span></a>` +
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
