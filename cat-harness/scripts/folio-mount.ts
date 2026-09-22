/**
 * The folio mount: how a page that is NOT folio-assistant's carries the
 * reader's folio. Bean `jpjt`, requirements F8/F9 on issue #796.
 *
 * Owner, 2026-09-21:
 *
 * > the folio visualisation … should by convention be available on any
 * > harness for consistent feel. who-iris, smart-* etc are content libraries
 * > a user is browsing and their "folio" from the cat-harness is consistent
 * > across them.
 *
 * ## What was measured, and why this is possible now and was not before
 *
 * `jpjt` measured the gap on the `who-iris` replica pages: `docs-ui.js` on
 * **0** of them, and loading it there would have mounted **nothing**, because
 * every folio surface was bound to just-the-docs page furniture — the
 * launcher wants a sidebar header, the board wants `<main>`, the language bar
 * wants `.main-content`. A replica page has none of those and must not grow
 * them: who-iris exists to look like WHO.
 *
 * R25's glass is the surface that does not care. It comes down OVER whatever
 * is being browsed, so `mountGlass()` appends to `document.body` and is
 * called from `init()` unconditionally, outside the guards that decide
 * whether a board mounts. `test/glass.e2e.ts` proves it against a fixture
 * with no `<main>`, no `.main-content`, no sidebar header and a todo index
 * that 404s — every condition a replica page meets.
 *
 * So this module ships the mount and nothing else. The glass is already
 * there.
 *
 * ## ONE folio, not a good one
 *
 * `board-windows` §"The folio belongs to the HARNESS" states the test, and it
 * is the reason this is a fragment rather than a port:
 *
 * > The test is not *"is this folio good"* but *"is this the same folio"*.
 *
 * Two harnesses that each build a good folio have both failed. So a page gets
 * the platform's own stylesheet and the platform's own script, by reference,
 * and there is no second implementation to drift.
 *
 * ## Why the root is derived in the browser
 *
 * These pages are served from **two** mount routes — `/who-iris/` and
 * `/docs/who-iris/` — so one generated file sits at two different depths
 * below the site root. A document-relative `href` is therefore correct under
 * one mount and 404s under the other, and `gen-iris-pages.ts` already says so
 * about its architecture drawing. An absolute site URL is the other obvious
 * answer and is worse: it bakes the publication base into a generated page,
 * which is what `canonicalUrl` exists to stop, and it breaks every staging
 * preview, which is served under `/STAGING/<branch>/`.
 *
 * The browser knows its own path. `siteRootOf` below derives the root and the
 * inlined `client` below applies the SAME pattern object, passed in by the
 * caller — so there is one expression rather than a function and a string
 * that must agree. `folio-mount.test.ts` runs the shipped bytes to check it,
 * the mechanism `staging-banner`'s `previewRootOf` already uses.
 *
 * ## Why the route shape is the CALLER's
 *
 * A generic module that hard-coded `who-iris` would be the platform knowing
 * about one library, which is the boundary this repository exists to keep.
 * The caller passes the pattern that finds its own instance root; the
 * platform owns the mount, the marker and the gate.
 *
 * @module scripts/folio-mount
 */

import { commentGuard } from "./html-comments.ts";

/**
 * The attribute the gate looks for.
 *
 * On the injected `<script>` element itself rather than on a wrapper `<div>`:
 * a wrapper would be a visible node on a page whose whole requirement is to
 * look untouched, and the glass builds its own chrome into `document.body`
 * when it mounts.
 */
export const MARKER = "data-fa-folio-mount";

/**
 * Derive the site root from a pathname, given the pattern that finds the
 * instance's own root.
 *
 * `pattern` is a regular expression whose **first capture group is the site
 * root, including its trailing slash**. For who-iris, mounted at both
 * `/who-iris/` and `/docs/who-iris/`:
 *
 *     /^(.*?)(?:docs\/)?who-iris\//
 *
 * Non-greedy, so it anchors on the FIRST occurrence: a library item whose
 * slug happened to contain the instance name cannot move the root.
 *
 * Returns `null` when the pathname does not match — a real state, not a
 * failure to paper over. The client leaves the page alone rather than
 * guessing a root and requesting two assets that 404.
 */
export function siteRootOf(pathname: string, pattern: RegExp): string | null {
  const m = pathname.match(pattern);
  return m && m[1] != null ? m[1] : null;
}

/**
 * The client half, inlined verbatim.
 *
 * Inlined for the same reason `staging-banner`'s is: a `<script src>` for the
 * bootstrap would itself need a document-relative href, reintroducing the
 * per-mount variation this exists to remove. It is ~700 bytes; the two real
 * assets it appends are ordinary cached requests.
 *
 * `media="print"`/`onload` is NOT used to defer the stylesheet. The glass is
 * interactive chrome and a flash of an unstyled handle is worse than a
 * marginally later paint — and the handle is the one control a reader needs
 * to find without being told.
 */
function client(patternSource: string): string {
  return `(function(){
var m=location.pathname.match(new RegExp(${JSON.stringify(patternSource)}));
if(!m||m[1]==null)return;
var r=m[1];
var l=document.createElement('link');
l.rel='stylesheet';l.href=r+'assets/css/docs-ui.css';
document.head.appendChild(l);
var s=document.createElement('script');
s.src=r+'assets/js/docs-ui.js';s.defer=true;
document.head.appendChild(s);
})();`;
}

/**
 * The fragment a generator injects, for a page whose site root is found by
 * `pattern`.
 *
 * Constant for a given pattern — it carries no per-page fact, so every page
 * of an instance gets byte-identical bytes. That is `g196`'s property and it
 * matters here for the same reason: a fragment varying per page makes every
 * rebuild a new blob in `gh-pages`.
 */
export function fragment(pattern: RegExp): string {
  return `<script ${MARKER}>${client(pattern.source)}</script>`;
}

/**
 * Whether a document already carries the mount.
 *
 * Asks for the marker rather than for the script's text, so a page that
 * carries the fragment inside an HTML comment — the `ur84` failure — is not
 * counted as mounted, through the SAME scanner `bodyInsertionPoint` uses
 * (`html-comments.ts`) rather than a second copy of it. `hasMount` asks
 * deliberately the same question the gate asks, so a page that passes the
 * gate is a page this function calls mounted.
 */
export function hasMount(html: string): boolean {
  const i = html.indexOf(MARKER);
  if (i < 0) return false;
  return !commentGuard(html)(i);
}
