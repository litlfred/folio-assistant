/**
 * The browser half of the rail in the page's language: which strings file a
 * page loads, and how a label is swapped. Browser-safe (no `node:` imports),
 * because `navbar-client.ts` bundles it; the writer is `navbar-strings.ts`.
 *
 * @module scripts/lib/navbar-locale
 */
import { RAIL_DATA_DIR } from "./harness-rail.ts";

/** The global the strings files fill, keyed by locale. */
export const NAV_STRINGS_GLOBAL = "FaNavStrings";

/** A locale's strings file, relative to the site root. */
export function navbarStringsFile(locale: string): string {
  return `${RAIL_DATA_DIR}/strings-${locale}.js`;
}

/**
 * The locale a page's rail should be drawn in, from its `<html lang>`: `undefined`
 * for no `lang` and for English, the language the rail's own words and the
 * shared rail data are written in, so an English page asks for no file.
 */
export function railLocale(lang: string | null | undefined): string | undefined {
  const l = (lang ?? "").trim().toLowerCase();
  if (!l || l === "en" || l.startsWith("en-")) return undefined;
  // A BCP 47 tag's shape and nothing else: it becomes part of a script's address.
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(l) ? l : undefined;
}

/**
 * The rail's `data-fa-root` as a script base, or `undefined`: only a relative
 * path of `.`/`..` segments (`.`, `..`, `../..`), which is all the rail writes.
 * Anything else (a scheme, a host, an absolute path) loads nothing.
 */
export function railRootPath(root: string | null | undefined): string | undefined {
  const r = (root ?? "").trim().replace(/\/+$/, "") || ".";
  return /^\.\.?(?:\/\.\.)*$/.test(r) ? r : undefined;
}

/**
 * Swap the rail's labels, names and tooltips for their translations, in place.
 *
 * EXACT MATCH OR NOTHING: a label is replaced only when its whole trimmed text
 * is a key, so a label with no entry keeps its English and nothing is ever half
 * translated. The text node is replaced, never the element, so the marks, the
 * links and every attribute the other scripts read stay as built.
 */
export function localiseRail(nav: ParentNode, map: Readonly<Record<string, string>>): number {
  let swapped = 0;
  nav.querySelectorAll(".fa-nav-label").forEach((el) => {
    el.childNodes.forEach((n) => {
      if (n.nodeType !== 3) return;
      const text = n.textContent ?? "";
      const key = text.trim();
      const to = key ? map[key] : undefined;
      if (to === undefined) return;
      n.textContent = text.replace(key, to);
      swapped++;
    });
  });
  nav.querySelectorAll("[aria-label],[data-fa-tip],[title]").forEach((el) => {
    for (const attr of ["aria-label", "data-fa-tip", "title"]) {
      const v = el.getAttribute(attr);
      const to = v ? map[v.trim()] : undefined;
      if (to !== undefined) {
        el.setAttribute(attr, to);
        swapped++;
      }
    }
  });
  return swapped;
}
