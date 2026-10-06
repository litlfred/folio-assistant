/**
 * Dark-scheme CSS that follows the reader's light/dark switch — issue #2208.
 *
 * A page written with `@media (prefers-color-scheme: dark) { … }` follows the
 * OPERATING SYSTEM and nothing else. On a folio's site the navbar's light bulb
 * sets `data-fa-scheme` on `<html>` (`docs-ui.js`'s `applyScheme`), and a page
 * styled only by the media query ignores it: owner, 2026-10-05, on smart-ra's
 * public-comment page, *"the LHS navbar icons work for the links … but not for
 * the other javscript ones like light bulb"*.
 *
 * {@link darkRules} writes the same rules twice, so one switch decides:
 *
 * - under the media query, unless the reader picked LIGHT
 *   (`:root:not([data-fa-scheme="light"])`) — the OS still decides for a reader
 *   who never pressed the switch;
 * - unconditionally under `:root[data-fa-scheme="dark"]` — a reader who picked
 *   DARK gets it on a light OS.
 *
 * Flat rules only (`selector, selector { declarations }`): a nested block is
 * refused rather than mangled, because a rule silently dropped from one of
 * the two copies is a page that is half dark.
 */
import { readFileSync } from "node:fs";

const NOT_LIGHT = `:root:not([data-fa-scheme="light"])`;
const DARK = `:root[data-fa-scheme="dark"]`;

/** Scope one selector under `root`: `:root` itself becomes `root`, anything else a descendant of it. */
function scoped(selector: string, root: string): string {
  const s = selector.trim();
  return s === ":root" ? root : s.startsWith(":root") ? root + s.slice(":root".length) : `${root} ${s}`;
}

/** `rules` re-scoped under `root`. */
function under(rules: string, root: string): string {
  const out: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let consumed = 0;
  for (const m of rules.matchAll(re)) {
    if (rules.slice(consumed, m.index).trim() !== "") break;
    consumed = m.index! + m[0].length;
    out.push(`${m[1]!.split(",").map((sel) => scoped(sel, root)).join(", ")} {${m[2]}}`);
  }
  if (rules.slice(consumed).trim() !== "") {
    throw new Error(`scheme-css: darkRules takes flat rules only; could not read ${JSON.stringify(rules.slice(consumed, consumed + 60))}`);
  }
  return out.join(" ");
}

/**
 * The dark-scheme `rules`, applied when the OS is dark and the reader has not
 * picked light, or whenever the reader has picked dark.
 */
export function darkRules(rules: string): string {
  return `@media (prefers-color-scheme: dark) { ${under(rules, NOT_LIGHT)} }\n  ${under(rules, DARK)}\n  ` +
    `:root[data-fa-scheme="light"] { color-scheme: light; } :root[data-fa-scheme="dark"] { color-scheme: dark; }`;
}

/**
 * The reader's saved colour scheme, applied to a standalone viewer — bean `dc64`.
 *
 * The dashboards (beans, todos, translation status) style both schemes through
 * `:root[data-fa-scheme="light"]`, and default to dark because the site's
 * configured `color_scheme` is dark. On a themed page `docs-ui.js` sets that
 * attribute from the reader's stored choice. These pages do not load it, so a
 * reader who picked LIGHT anywhere on the site still got dark here.
 *
 * A few bytes in the HEAD, run before first paint so the page does not flash
 * dark and then flip. It reads ONLY a stored choice: with none, the page keeps
 * its CSS default, which is the configured scheme, the same fallback
 * `docs-ui.js` uses.
 *
 * The storage key is read out of `docs-ui.js` at generation time, not written
 * down again here. Two copies of a key are two answers free to disagree, and a
 * rename in one would silently disconnect every dashboard.
 */
export function withSavedScheme(html: string): string {
  if (html.includes(SCHEME_MARK)) return html;
  const head = /<head\b[^>]*>/i.exec(html);
  if (!head) return html;
  const key = JSON.stringify(schemeKey());
  const script =
    `<script ${SCHEME_MARK}>try{var s=localStorage.getItem(${key});` +
    `if(s==="light"||s==="dark")document.documentElement.setAttribute("data-fa-scheme",s)}catch(e){}</script>\n`;
  const at = head.index + head[0].length;
  return html.slice(0, at) + "\n" + script + html.slice(at);
}

const SCHEME_MARK = `data-folio-saved-scheme`;

let schemeKeyCache: string | undefined;
/** The key `docs-ui.js` stores the reader's scheme under. Throws if it cannot be found: a silent default would disconnect every page. */
export function schemeKey(): string {
  if (schemeKeyCache) return schemeKeyCache;
  // declared-path-literal: a platform asset beside this module, not a folio
  // directory. It is the one place the key is defined.
  const js = readFileSync(new URL("../../docs/assets/js/docs-ui.js", import.meta.url), "utf-8");
  const m = /var SCHEME_KEY = "([^"]+)";/.exec(js);
  if (!m) throw new Error("viewer-page: docs-ui.js no longer declares SCHEME_KEY — the dashboards cannot follow the reader's scheme");
  schemeKeyCache = m[1]!;
  return schemeKeyCache;
}
