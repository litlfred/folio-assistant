/**
 * Which URL schemes may reach an `href`, and why the answer is a list.
 *
 * @module schemas/safe-url
 * @graphNode schema
 *
 * ## R17, and what it actually asks for here
 *
 * The owner, 2026-09-20: *"skill tool hints for XSSrsiction., usse laxy load
 * XSS, assume assets in KG accessible, dynamic render where can"*. Bean
 * `q2wm` breaks the first out by output schema, and singles out the case this
 * module is: *"`Url` — rendered into an `href`, `javascript:` is the classic
 * hole"*.
 *
 * ## The hazard here is LATENT, and saying which it is matters
 *
 * Measured 2026-09-21, on the render points this PR added. Every URL that
 * reaches an `href` today is composed rather than taken:
 * `gen-docs-pages.ts` interpolates authored values into
 * `https://github.com/…`, `sourceLinks` builds from the git origin, and
 * `publishedHref` returns a `/`-prefixed path. **No `javascript:` is
 * reachable.**
 *
 * So this is not a fix for a live hole, and claiming one would be the same
 * dishonesty in the other direction. It is the difference between a property
 * that is EMERGENT and one that is ENFORCED:
 *
 * - `TodoRelationSchema.href` is `z.string()`. The schema permits
 *   `javascript:alert(1)` and always has.
 * - `escapeHtml` closes tags and does nothing about a scheme — an escaper is
 *   the wrong tool for this and looks like the right one.
 * - The composition that makes it safe is spread across three files and
 *   stated in none of them.
 *
 * An edit that passed an authored URL straight through would open the hole
 * and look like a simplification. This module is what makes that edit fail.
 *
 * ## DEFAULT-DENY, and it is the only defensible default
 *
 * A blocklist has to enumerate every dangerous scheme — `javascript:`,
 * `data:`, `vbscript:`, whatever a browser ships next — and is wrong the day
 * one is added. An allow-list is wrong only about things it refuses, and a
 * refusal is visible: the link is not rendered, somebody notices, and the
 * scheme is added deliberately. That asymmetry is the whole argument.
 *
 * ## `data:` IS NOT ALLOWED, including for images
 *
 * It is tempting for an inline asset, and R17's third instruction points the
 * other way: *"assume assets in KG accessible"* — an asset reachable from the
 * knowledge graph is ADDRESSABLE, so it is referenced where it lives rather
 * than copied into the page. `data:text/html` is a navigable document with a
 * same-origin-ish reputation it does not deserve, and allowing the scheme for
 * images would mean parsing the media type to decide — a parser in the middle
 * of a security boundary.
 */

/**
 * The schemes a rendered link may carry.
 *
 * `mailto:` and `tel:` are here because they are real links a folio writes and
 * neither can execute anything. Adding to this list is a deliberate act with a
 * reason; that is the point of the list existing.
 */
export const ALLOWED_URL_SCHEMES: readonly string[] = ["http:", "https:", "mailto:", "tel:"];

/** Why a URL was refused — for a caller that wants to report rather than drop. */
export interface UrlRefusal {
  url: string;
  because: string;
}

/**
 * Is this a same-document or same-site reference rather than an absolute URL?
 *
 * `/x`, `./x`, `x`, `#frag`, `?q=1` carry no scheme and cannot introduce one.
 * **`//host/path` is excluded deliberately**: protocol-relative URLs look like
 * paths and are absolute, so a folio published over http would fetch them over
 * http, and a reader who checked the page's own scheme would be wrong about
 * where the link goes.
 */
function isRelative(url: string): boolean {
  if (url.startsWith("//")) return false;
  return /^[#?./]/.test(url) || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
}

/**
 * The URL if it may be rendered, or `undefined`.
 *
 * `undefined` rather than a thrown error or an empty string: a caller renders
 * the label as text instead, which is `pb04`'s rule — a link to nowhere is
 * worse than no link — and an empty `href` is a link to the current page,
 * which is a link to somewhere wrong.
 *
 * ## What it normalises before deciding, and why each one
 *
 * - **Leading and trailing whitespace**, including the C0 controls a browser
 *   strips from an attribute before parsing it. `"\\tjavascript:x"` is a
 *   working `javascript:` URL in every browser and is not one to a naive
 *   `startsWith`.
 * - **Case**: `JaVaScRiPt:` is the same scheme.
 *
 * - **Tab, newline and carriage return, ANYWHERE in the string** — the three
 *   characters the URL parser itself removes before parsing. `java\\tscript:`
 *   is `javascript:` to a browser and a relative path to a naive scheme test.
 *
 * It does NOT decode percent-escapes or HTML entities. Those are undone by
 * layers with their own rules, and a decoder here would be a second parser
 * disagreeing with the browser's — which is how filters get bypassed rather
 * than how they work. Removing the three characters the URL spec itself
 * removes is matching that parser, not guessing at it.
 */
export function safeHref(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  // TAB / LF / CR are removed EVERYWHERE, not just at the ends: the URL
  // parser strips exactly these three before parsing, so leaving one in the
  // middle leaves a `javascript:` URL looking like a relative path. The first
  // version of this function trimmed only the ends and shipped that bypass;
  // its own spec caught it.
  //
  // eslint-disable-next-line no-control-regex
  const stripped = url.replace(/[\u0009\u000A\u000D]/g, "");
  const trimmed = stripped.replace(/^[\u0000- ]+/, "").replace(/[\u0000- ]+$/, "");
  if (trimmed === "") return undefined;
  if (isRelative(trimmed)) return trimmed;
  const scheme = trimmed.slice(0, trimmed.indexOf(":") + 1).toLowerCase();
  return ALLOWED_URL_SCHEMES.includes(scheme) ? trimmed : undefined;
}

/**
 * The same decision, with the reason — for a renderer that reports gaps.
 *
 * Returning why lets a caller say *"this link was refused"* rather than
 * silently showing text, which is the same distinction `panel-chrome.ts` draws
 * between a control that is not offered and one that cannot be served.
 */
export function checkHref(url: string | undefined): { href?: string; refusal?: UrlRefusal } {
  if (url === undefined) return {};
  const href = safeHref(url);
  if (href !== undefined) return { href };
  return {
    refusal: {
      url,
      because:
        `"${url.slice(0, 60)}" does not carry an allowed scheme ` +
        `(${ALLOWED_URL_SCHEMES.join(", ")}) and is not a relative reference, so it is ` +
        `rendered as text rather than as a link.`,
    },
  };
}
