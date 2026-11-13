/**
 * Translated copies of an IG's narrative pages (fhir-harness#382).
 *
 * An IG keeps one gettext catalogue per page and locale at
 * `translations/<locale>/pagecontent/<page>.po`, extracted from
 * `input/pagecontent/<page>.md` by cat-harness-tools `extractMarkdown`. Until
 * this module, the IG site route read none of them: every page carried the
 * language picker with `availableLocales: []`, so each language other than
 * the source showed greyed out (owner, 2026-11-11: "why not translations?").
 *
 * Here each catalogue is injected into its page with cat-harness-tools
 * `injectMarkdown`, the same segmentation the catalogue was written from, and
 * the translated page is placed at `<locale>/<page>.md`. That is the path the
 * language picker opens (`docs-ui.js` `localePath`: `/<base>/<locale>/<file>`).
 *
 * A span with no translation (a fuzzy or empty entry, or English edited after
 * the catalogue was made) stays in English, as on every other folio site.
 *
 * Officiality is the platform's own record (`check:translation-officiality`):
 * a locale is `verified` only when `translations/<locale>/status.json` says
 * `official: true` with `signedOffBy` and `signedOffAt`. Otherwise the page is
 * `unverified`, and `docs-ui.js` shows its "Unverified translation" notice.
 *
 * @module scripts/ig-page-translations
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { injectMarkdown, parsePo } from "../../cat-harness-tools/pipeline/po-inject.ts";

/** The language picker's default list: the six UN languages, as `translation-meta.ts` declares them. */
export const UN_LOCALES = ["ar", "zh", "en", "fr", "ru", "es"] as const;

/** The source language of an IG's pages. */
export const SOURCE_LOCALE = "en";

/** One locale's catalogues for the IG's pages. */
export interface PageLocale {
  locale: string;
  /** `verified` when the locale is signed off, `unverified` otherwise. */
  status: "verified" | "unverified";
  /** Page stem (`concepts`) to its parsed catalogue. Only catalogues with at least one translated entry. */
  catalogues: Map<string, Map<string, string>>;
}

/** Whether `translations/<locale>/status.json` records a sign-off. */
export function signedOff(dir: string): boolean {
  const p = join(dir, "status.json");
  if (!existsSync(p)) return false;
  try {
    const s = JSON.parse(readFileSync(p, "utf-8")) as { official?: unknown; signedOffBy?: unknown; signedOffAt?: unknown };
    return s.official === true && typeof s.signedOffBy === "string" && s.signedOffBy !== "" && typeof s.signedOffAt === "string" && s.signedOffAt !== "";
  } catch {
    return false;
  }
}

/**
 * Every locale under `translationsDir` with page catalogues, sorted. The
 * source locale is never one. A catalogue that translates nothing is left
 * out, so a page never claims a language it has no words in.
 */
export function pageLocales(translationsDir: string | undefined): PageLocale[] {
  if (!translationsDir || !existsSync(translationsDir)) return [];
  const out: PageLocale[] = [];
  for (const locale of readdirSync(translationsDir).sort()) {
    if (locale === SOURCE_LOCALE || !/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(locale)) continue;
    const dir = join(translationsDir, locale);
    const pc = join(dir, "pagecontent");
    if (!statSync(dir).isDirectory() || !existsSync(pc)) continue;
    const catalogues = new Map<string, Map<string, string>>();
    for (const f of readdirSync(pc).filter((n) => n.endsWith(".po")).sort()) {
      const po = parsePo(readFileSync(join(pc, f), "utf-8"));
      if ([...po.values()].some((v) => v.trim() !== "")) catalogues.set(f.replace(/\.po$/, ""), po);
    }
    if (catalogues.size) out.push({ locale, status: signedOff(dir) ? "verified" : "unverified", catalogues });
  }
  return out;
}

/** The locales a page can be read in: the source first, then each with a catalogue for it. */
export function localesFor(stem: string, locales: readonly PageLocale[]): string[] {
  return [SOURCE_LOCALE, ...locales.filter((l) => l.catalogues.has(stem)).map((l) => l.locale)];
}

/** One page translated: the Markdown and how many of its spans were. */
export function translatePage(sourceMd: string, catalogue: Map<string, string>): { md: string; translated: number; total: number } {
  const r = injectMarkdown(sourceMd, catalogue);
  return { md: r.translated, translated: r.stats.translatedSpans, total: r.stats.totalSpans };
}

const INCLUDE_RE = /\{%-?\s*include\s+([^\s%]+)\s*-?%\}/g;

/** The pages `md` includes by name (`{% include overview.md %}`), as stems of `pages`. */
export function includedPages(md: string, pages: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const m of md.matchAll(INCLUDE_RE)) {
    const stem = m[1]!.replace(/\.md$/, "");
    if (m[1]!.endsWith(".md") && pages.has(stem) && !out.includes(stem)) out.push(stem);
  }
  return out;
}

/**
 * Whether a page has anything in `locale`: its own catalogue, or one of a page
 * it includes. An IG's home page is often only includes
 * (`{% include overview.md %}`), with no string of its own.
 */
export function hasTranslation(stem: string, l: PageLocale, sourceOf: (stem: string) => string | undefined, pages: ReadonlySet<string>, seen = new Set<string>()): boolean {
  if (l.catalogues.has(stem)) return true;
  if (seen.has(stem)) return false;
  seen.add(stem);
  const md = sourceOf(stem);
  return md !== undefined && includedPages(md, pages).some((s) => hasTranslation(s, l, sourceOf, pages, seen));
}

/**
 * One page translated, with each page it includes inlined in the same
 * language. An included page left as `{% include x.md %}` would render the
 * English copy in `_includes/`, so a French home page would read English.
 * An included page with nothing in this locale stays an include (English).
 */
export function translateWithIncludes(
  stem: string,
  l: PageLocale,
  sourceOf: (stem: string) => string | undefined,
  pages: ReadonlySet<string>,
  depth = 0,
): { md: string; translated: number; total: number } {
  const src = sourceOf(stem) ?? "";
  const own = l.catalogues.get(stem);
  const t = own ? translatePage(src, own) : { md: src, translated: 0, total: 0 };
  let { translated, total } = t;
  if (depth >= 4) return t;
  const md = t.md.replace(INCLUDE_RE, (whole, name: string) => {
    const s = name.replace(/\.md$/, "");
    if (!name.endsWith(".md") || !pages.has(s) || s === stem || !hasTranslation(s, l, sourceOf, pages)) return whole;
    const inner = translateWithIncludes(s, l, sourceOf, pages, depth + 1);
    translated += inner.translated;
    total += inner.total;
    return inner.md.trim();
  });
  return { md, translated, total };
}

const LANG_FRAGMENT_RE = /\{%-?\s*lang-fragment\s+([^\s%]+)\s*-?%\}/g;

/** A fragment's name in one locale, as the IG Publisher names it: `x.html` → `x-fr.html`. */
export function fragmentFor(name: string, locale: string): string {
  const slash = name.lastIndexOf("/");
  const dot = name.lastIndexOf(".");
  return dot > slash + 1 ? `${name.slice(0, dot)}-${locale}${name.slice(dot)}` : `${name}-${locale}`;
}

/**
 * The HL7 IG Publisher's `{% lang-fragment x %}` as a plain include: on a page
 * in `locale`, the locale's own fragment (`x-<locale>.<ext>`) when the IG has
 * one, otherwise `x` itself, so a page in a language with no fragment reads
 * the source's (owner, 2026-11-13: "translate ... the cards"). With no locale
 * (the source page), always `x`.
 */
export function resolveLangFragments(md: string, locale: string | undefined, has: (name: string) => boolean): string {
  return md.replace(LANG_FRAGMENT_RE, (_w, name: string) => {
    const own = locale ? fragmentFor(name, locale) : undefined;
    return `{% include ${own && has(own) ? own : name} %}`;
  });
}

const SKIP_URL = /^(?:[a-z][a-z0-9+.-]*:|\/|#|\{\{|\{%|\.\.\/)/i;

/**
 * Point a translated page's relative links one level up, since it sits at
 * `<locale>/<page>`. A link to another page translated into the same locale
 * (`translatedHere`, the `.html` names) stays relative, so a reader keeps
 * their language as they move between pages. Absolute, site-rooted, Liquid,
 * anchor-only and already-parent links are left as written.
 */
export function relinkForLocale(md: string, translatedHere: ReadonlySet<string>): string {
  const fix = (url: string): string => {
    if (!url || SKIP_URL.test(url)) return url;
    const file = url.replace(/^\.\//, "").split(/[?#]/)[0]!;
    if (translatedHere.has(file)) return url;
    return `../${url.replace(/^\.\//, "")}`;
  };
  return md
    // Markdown links and images: ](target) or ](target "title")
    .replace(/\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g, (_w, url: string, title: string) => `](${fix(url)}${title})`)
    // Reference definitions: [id]: target
    .replace(/^(\s{0,3}\[[^\]]+\]:\s*)(\S+)/gm, (_w, pre: string, url: string) => `${pre}${fix(url)}`)
    // HTML attributes
    .replace(/\b(href|src)=(["'])([^"']*)\2/g, (_w, attr: string, q: string, url: string) => `${attr}=${q}${fix(url)}${q}`);
}

/**
 * The front matter keys the language picker reads (`fa-translation-meta`):
 * the page's language, the locales it can be read in, and on a translation
 * its status and source page.
 */
export function localeFrontMatter(o: { lang: string; available: readonly string[]; status?: string; source?: string; supported?: readonly string[] }): Record<string, unknown> {
  return {
    lang: o.lang,
    available_locales: [...o.available],
    supported_locales: [...(o.supported ?? UN_LOCALES)],
    ...(o.status ? { translation_status: o.status } : {}),
    ...(o.source ? { translation_source: o.source } : {}),
  };
}

/**
 * The picker's block, written by the thin layout from the page's front
 * matter, so a page that has translations names them. A page without
 * `available_locales` gets nothing here and keeps the block
 * `publisher-pages` stamps (`stampTranslationMeta`).
 */
export const TRANSLATION_META_LIQUID = [
  "{% if page.available_locales %}",
  '<script type="application/json" id="fa-translation-meta">{"lang":{{ page.lang | default: "en" | jsonify }},',
  '"translationStatus":{{ page.translation_status | default: "" | jsonify }},',
  '"translationSource":{{ page.translation_source | default: "" | jsonify }},',
  '"supportedLocales":{{ page.supported_locales | jsonify }},',
  '"availableLocales":{{ page.available_locales | jsonify }}}</script>',
  "{% endif %}",
].join("");

/** Right-to-left scripts among the locales an IG may carry. */
const RTL = new Set(["ar", "he", "fa", "ur"]);

/** `rtl` for a right-to-left locale, else `ltr`. */
export function dirFor(locale: string): "rtl" | "ltr" {
  return RTL.has(locale.split("-")[0]!) ? "rtl" : "ltr";
}
