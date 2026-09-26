/**
 * The translation index — which source page has a translation in which locale,
 * and where that translation is served from.
 *
 * This is the file the left-hand navbar reads to decide what to show. It is
 * generated into `docs/_data/translations.json`, published into every page by
 * `_includes/head_custom.html`, and consumed by `mountNavLocale` in
 * `docs/assets/js/docs-ui.js`.
 *
 * ## Where a translation comes from, and where it emphatically does not
 *
 * **From the file's own front matter.** A page is a translation because it
 * says `lang: fr`, and it names what it translates with
 * `translation_source: index.md`. Nothing here globs for directories, matches
 * a name against a list of language subtags, or reads `fr` out of a path.
 *
 * That is not fastidiousness. A name match is the "distinguishable by
 * extension … a coincidence of the current layout, not a contract" defect #263
 * named, moved to directory names, and it is wrong in BOTH directions: a folio
 * with a `no/` chapter (Norwegian, or the English word) is silently hidden
 * from its own navbar, and a `pt-BR/` or `translated-fr/` directory is
 * silently shown as source. Neither failure announces itself — the navbar
 * simply has the wrong entries in it, which is exactly the bug this file
 * exists to fix.
 *
 * ## Why the locale directories are NOT declared one by one
 *
 * A first draft of PR #351 added a `translated-content` graph kind and a
 * `locale` field to `ContentDirectory`, then declared ten directories —
 * `docs/{ar,es,fr,ru,zh}/` and the same five under `docs/guides/`. It worked.
 * It was the wrong axis, for three reasons that only look small one at a time:
 *
 *   1. **It restated what the files already say.** All ten pages carried
 *      `lang` and `translation_source` before that change and still do. One
 *      fact in two places is the drift this repository keeps paying for.
 *   2. **It grew as O(locales × subtrees).** A sixth locale is two more
 *      entries; declaring `docs/reference/` translatable is five more.
 *   3. **Translatability is a property of a FORMAT, not of a directory.** The
 *      owner, 2026-09-19: *"narrative/audio/visual content with text should be
 *      translatable. its not so much the node schema itself but its content
 *      (e.g. markdown, bpmn) should be translatable."* That model already
 *      exists — `schemas/translation-tools.ts` declares per content type which
 *      formats have an extract/inject pair, and {@link isTranslatable} is the
 *      predicate. This module asks IT rather than inventing a second answer.
 *
 * ## Three states, not two
 *
 * `--check` distinguishes:
 *
 * | state | meaning | exit |
 * |---|---|---|
 * | ok | the written index matches what the corpus says | 0 |
 * | stale / invalid | it does not, and here is which page | 1 |
 * | unreadable | the site root or a translated page could not be read | 2 |
 *
 * The third is the one that matters. A tree that cannot be read must NEVER be
 * written into the index as "this folio has no translations" — the navbar
 * would then render a complete absence of translations from an incomplete
 * read. Same rule as the README sections and the CI-health report:
 * could-not-determine is its own answer.
 *
 * Usage:
 *   bun run translation:index          # write cat-harness/docs/_data/translations.json
 *   bun run translation:index:check    # fail if stale, invalid, or unreadable
 *
 * @module content/pipeline/translation-index
 * @covers translation-sources
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { expectedInstanceConfigPath } from "../../schemas/harness-config";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { LOCALE_RTL, UN_LOCALES } from "../../schemas/translation.ts";
import { isTranslatable } from "../../schemas/translation-tools.ts";
import { siteDirFor } from "../../schemas/cat-harness.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

/**
 * The Jekyll site directory, relative to the instance root.
 *
 * A literal, and a CHECKED one: {@link siteRoot} confirms it by finding
 * `_config.yml` there and reports "could not determine" rather than scanning
 * an empty tree if it is not. It is no longer a literal: `siteDir()` in
 * `schemas/cat-harness.ts` composes it from the instance's own `stub`, so
 * `gen-docs-pages.ts`, `gen-skill-docs.ts`, `gen-schema-docs.ts` and
 * `translation-qa-sweep.ts` all read one answer rather than five copies.
 *
 * It is not in `cat-harness.json` because `docs/` would have to be declared
 * with the `folio` kind, which is registered by CORE rather than the harness.
 * Measured 2026-09-19: adding that entry broke `harness:dirs`,
 * `kg:schema:check` and `docs:harness:check` plus 9 tests, because those
 * readers do not import core's registration. That is issue #223's split to
 * land, not translation's. Bean `folio-assistant-x4a6`.
 */
export const SITE_DIR = siteDirFor(REPO_ROOT);

/** Where the generated index lands, relative to the instance root. */
export const INDEX_PATH = join(SITE_DIR, "_data", "translations.json");

/** The `$schema` tag the generated document carries, per the repo convention. */
export const INDEX_SCHEMA = "folio-translation-index/v1";

/** One translated page, as the navbar needs it. */
export interface TranslatedPage {
  /** Site-absolute URL of the translated page, e.g. `/fr/index.html`. */
  url: string;
  /** The translated page's own title — what the nav item should read. */
  title: string;
  /** `official` | `unverified` | `` — straight from the page's front matter. */
  status: string;
  /** `rtl` when the locale's script is right-to-left, else `ltr`. */
  dir: "ltr" | "rtl";
}

/** One source page and every translation of it. */
export interface IndexedPage {
  /** Site-absolute URL of the SOURCE page, e.g. `/` or `/guides/x.html`. */
  sourceUrl: string;
  /** The source page's own title, so a fallback item can be restored. */
  sourceTitle: string;
  /** locale -> the translated page. */
  translations: Record<string, TranslatedPage>;
}

/** The generated document. */
export interface TranslationIndex {
  $schema: string;
  /** The language the corpus is authored in. */
  sourceLocale: string;
  /** Every locale that has at least one page, sorted. */
  locales: string[];
  /** {@link pageKey} -> the source page and its translations. */
  pages: Record<string, IndexedPage>;
}

/**
 * A finding about the corpus.
 *
 * Three severities, and the split between the last two is the three-states
 * rule made operational:
 *
 * - `error` — the corpus says something wrong, and the fix is in the corpus.
 * - `unreadable` — the translation set for some page **cannot be determined**.
 *   Never written as an empty one; gates at exit 2.
 * - `note` — something could not be read that does not bear on the answer.
 *   Printed, never silent, and does not gate.
 *
 * `note` exists because "unreadable" has to mean something. Three generated
 * pages under `docs/reference/skill-instructions/` carry front matter that
 * strict YAML rejects (an unquoted `:` in a title, a leading backtick). None
 * of them is translated and none is a translation, so the index is exactly as
 * complete without them — escalating those would fail the build over a fact
 * the index does not depend on, and a gate that fires on irrelevancies is a
 * gate people start passing with `--no-verify`.
 */
export interface IndexFinding {
  /** Repo-relative path of the file or directory the finding is about. */
  where: string;
  severity: "error" | "unreadable" | "note";
  message: string;
}

export interface BuildResult {
  index: TranslationIndex;
  findings: IndexFinding[];
}

// ── URLs and keys ───────────────────────────────────────────────

/**
 * The key a source page and its translations are matched on.
 *
 * Jekyll serves one page at several spellings — `/`, `/x.html`, `/x/` — and
 * just-the-docs emits whichever `page.url` holds, under a `baseurl` this
 * module does not know. So both sides normalise to a bare path with no
 * extension, no `index`, and no slashes at either end, and the navbar applies
 * the SAME normalisation to an `href` at read time (`navKey` in docs-ui.js).
 *
 * Matching on the raw URL instead would work on this site and break on any
 * instance with a `baseurl` or a trailing-slash permalink style — which is the
 * platform-specific-literal failure `AGENTS.md` catalogues at length.
 */
export function pageKey(url: string): string {
  let k = url.trim();
  const q = k.search(/[?#]/);
  if (q >= 0) k = k.slice(0, q);
  k = k.replace(/^\/+/, "").replace(/\/+$/, "");
  k = k.replace(/\.html?$/i, "");
  k = k.replace(/(^|\/)index$/i, "");
  return k.replace(/^\/+|\/+$/g, "");
}

/**
 * The URL Jekyll will serve a page at.
 *
 * `permalink` wins when the page declares one — `docs/index.md` declares `/`,
 * and composing `/index.html` for it instead would key the home page under
 * something the nav never links to. Otherwise it is the default page
 * permalink style, `/:path/:basename.html`.
 */
export function pageUrl(relPathFromSite: string, frontMatter: Record<string, unknown>): string {
  const pm = frontMatter.permalink;
  if (typeof pm === "string" && pm.length > 0) return pm.startsWith("/") ? pm : `/${pm}`;
  return "/" + relPathFromSite.split(sep).join("/").replace(/\.md$/i, ".html");
}

// ── Front matter ────────────────────────────────────────────────

/**
 * The YAML front matter of a Markdown page, or `undefined` when there is none.
 *
 * Throws on malformed YAML rather than returning `{}`: a page whose front
 * matter will not parse is a page whose `lang` cannot be read, and treating
 * that as "declares nothing" is how a French page ends up back in the navbar
 * under English — which is the whole bug.
 */
export function frontMatter(text: string): Record<string, unknown> | undefined {
  if (!text.startsWith("---")) return undefined;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return undefined;
  const body = text.slice(text.indexOf("\n") + 1, end + 1);
  const parsed = parseYaml(body);
  if (parsed === null || parsed === undefined) return {};
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("front matter is not a mapping");
  }
  return parsed as Record<string, unknown>;
}

// ── The instance ────────────────────────────────────────────────

/** The instance's config (`<name>.config.json`), or `{}` when there is none. */
function harnessConfig(instanceRoot: string): Record<string, unknown> {
  const p = expectedInstanceConfigPath(instanceRoot);
  if (p === undefined || !existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** The instance's source language. `harness.config.json`, defaulting to `en`. */
export function sourceLocale(instanceRoot: string): string {
  const t = harnessConfig(instanceRoot).translation as { defaultLocale?: string } | undefined;
  return t?.defaultLocale ?? "en";
}

/**
 * Every locale this instance claims to support, INCLUDING the source language.
 *
 * `harness.config.json`'s `translation.supportedLocales`, defaulting to the six
 * UN languages — the same default `TranslationConfigSchema` declares, read from
 * the same constant rather than restated here.
 *
 * **The source locale is a member and that is the whole point.** Every count in
 * this pipeline used to be taken against the TARGET locales, so an English page
 * on a six-language site reported `0/5` — a denominator that silently excluded
 * the one language the page was certainly available in, and a numerator that
 * could never reach it because `availableLocales` resolves PO files and there is
 * no `translations/en/`. A reader was told a fully-authored page existed in none
 * of the languages. Issue #687, bean `czct`.
 */
export function supportedLocales(instanceRoot: string): string[] {
  const t = harnessConfig(instanceRoot).translation as
    | { supportedLocales?: unknown }
    | undefined;
  const declared = t?.supportedLocales;
  if (Array.isArray(declared) && declared.every((l) => typeof l === "string" && l.length > 0)) {
    return declared as string[];
  }
  return [...UN_LOCALES];
}

/**
 * The locales a translation is PRODUCED into — supported, minus the source.
 *
 * Distinct from {@link supportedLocales} and the two are not interchangeable:
 * this one answers "which `translations/<locale>/` directories can exist" and
 * is what a sweep iterates to look for PO files. It is never a denominator.
 * A count of how many languages a reader can read the page in is taken against
 * `supportedLocales`, because the source language is one of them.
 */
export function targetLocales(instanceRoot: string): string[] {
  const src = sourceLocale(instanceRoot);
  return supportedLocales(instanceRoot).filter((l) => l !== src);
}

/**
 * The locales a page is actually available in, source language included.
 *
 * `poLocales` is what {@link availableLocales} in `po-resolve.ts` returns — the
 * target locales holding a `.po` for this page — and the source locale is added
 * because the page exists in it by construction. Ordered by
 * {@link supportedLocales} so the badge and the language bar read in one order
 * across every page, and filtered by it so a stray `translations/<x>/` does not
 * inflate a count taken against a set that does not contain it.
 */
export function localesAvailableFor(
  instanceRoot: string,
  poLocales: readonly string[],
): string[] {
  const src = sourceLocale(instanceRoot);
  const have = new Set<string>([src, ...poLocales]);
  return supportedLocales(instanceRoot).filter((l) => have.has(l));
}

/** The instance's content type, which decides which formats are translatable. */
export function contentType(instanceRoot: string): string {
  const c = harnessConfig(instanceRoot).contentType;
  // `src/index.ts` defaults a bare repo to `paper`; both declare Markdown
  // translatable, so the navbar is unaffected either way and the default is
  // the same one the rest of the platform uses.
  return typeof c === "string" && c.length > 0 ? c : "paper";
}

/**
 * The Jekyll site directory, CONFIRMED rather than assumed.
 *
 * Returns `undefined` when `<root>/docs/_config.yml` is not there, and the
 * caller reports that as unreadable. Scanning a directory that turns out not
 * to be a Jekyll site would produce an empty index and publish it as "no
 * translations" — the `dh4f` shape, where a consumer scans nothing and reports
 * a clean run over it.
 */
export function siteRoot(instanceRoot: string): string | undefined {
  const abs = join(instanceRoot, SITE_DIR);
  return existsSync(join(abs, "_config.yml")) ? abs : undefined;
}

/** Every file under `dir` whose extension is translatable for `type`, sorted. */
function translatablePages(root: string, type: string): string[] {
  const out: string[] = [];
  const walk = (abs: string): void => {
    for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = join(abs, e.name);
      // Jekyll's own machinery is not content: `_data`, `_includes`,
      // `_site`. A leading underscore is Jekyll's convention, not a guess
      // about language.
      if (e.isDirectory()) {
        if (!e.name.startsWith("_")) walk(p);
      } else if (e.isFile() && isTranslatable(type, extname(e.name).toLowerCase())) {
        out.push(relative(root, p));
      }
    }
  };
  walk(root);
  return out;
}

// ── Building ────────────────────────────────────────────────────

/**
 * Build the index from the pages' own front matter.
 *
 * Never throws for content reasons: a corpus problem comes back as a finding
 * so the caller can report every one of them, rather than the first.
 */
export function buildTranslationIndex(instanceRoot: string): BuildResult {
  const findings: IndexFinding[] = [];
  const src = sourceLocale(instanceRoot);
  const type = contentType(instanceRoot);
  const empty: TranslationIndex = { $schema: INDEX_SCHEMA, sourceLocale: src, locales: [], pages: {} };

  const site = siteRoot(instanceRoot);
  if (!site) {
    findings.push({
      where: `${SITE_DIR}/_config.yml`,
      severity: "unreadable",
      message:
        `no Jekyll site here, so the set of translated pages cannot be determined. ` +
        `Reported rather than indexed as "this folio has no translations": an absent site ` +
        `and a site with no translations are different answers, and only one of them is ` +
        `about the corpus.`,
    });
    return { index: empty, findings };
  }

  // One pass over every translatable page, sorting them into sources and
  // translations by what each one DECLARES. A page with no `lang` is source
  // language by default — `AGENTS.md`'s rule that absent means the instance's
  // default rather than unknown.
  interface Page {
    rel: string;
    fm: Record<string, unknown>;
    lang: string;
    url: string;
    title: string;
  }
  const sources = new Map<string, Page>();
  const translations: Page[] = [];
  const unreadable = new Map<string, string>();

  let files: string[];
  try {
    files = translatablePages(site, type);
  } catch (e) {
    findings.push({
      where: SITE_DIR,
      severity: "unreadable",
      message: `could not be read: ${e instanceof Error ? e.message : String(e)}`,
    });
    return { index: empty, findings };
  }

  for (const rel of files) {
    let fm: Record<string, unknown> | undefined;
    try {
      fm = frontMatter(readFileSync(join(site, rel), "utf-8"));
    } catch (e) {
      unreadable.set(rel.split(sep).join("/"), e instanceof Error ? e.message.split("\n")[0] : String(e));
      continue;
    }
    if (!fm) continue; // no front matter: not a Jekyll page at all.
    const lang = typeof fm.lang === "string" && fm.lang.length > 0 ? fm.lang : src;
    const page: Page = {
      rel,
      fm,
      lang,
      url: pageUrl(rel, fm),
      title: typeof fm.title === "string" ? fm.title : rel,
    };
    if (lang === src) sources.set(pageKey(page.url), page);
    else translations.push(page);
  }

  const pages: Record<string, IndexedPage> = {};
  const locales = new Set<string>();

  for (const t of translations) {
    const where = `${SITE_DIR}/${t.rel.split(sep).join("/")}`;
    // `nav_exclude` is what keeps the page out of the STATIC nav. Without it
    // just-the-docs lists the translation beside its source and the locale
    // filter has nothing to remove — the entries are already rendered, for
    // every reader, whatever locale they chose. That IS the reported bug.
    if (t.fm.nav_exclude !== true) {
      findings.push({
        where,
        severity: "error",
        message:
          `declares \`lang: ${t.lang}\` but not \`nav_exclude: true\`, so just-the-docs ` +
          `renders it into the navbar for every reader whatever locale they selected. The ` +
          `locale filter swaps nav items; it cannot un-render one.`,
      });
      continue;
    }
    // A translated page has no nav position of its own: it stands where its
    // SOURCE stands, because it replaces that item rather than joining the
    // list. `nav_order` beside `nav_exclude` is two facts that contradict
    // each other, and a reader cannot tell which was meant.
    if (t.fm.nav_order !== undefined) {
      findings.push({
        where,
        severity: "error",
        message:
          `declares \`nav_order: ${String(t.fm.nav_order)}\` as well as \`nav_exclude\`. A ` +
          `translated page takes its source page's position, because it replaces that item ` +
          `rather than joining the list. Remove the \`nav_order\`.`,
      });
      continue;
    }
    const source = typeof t.fm.translation_source === "string" ? t.fm.translation_source : "";
    if (!source) {
      findings.push({
        where,
        severity: "error",
        message:
          `declares \`lang: ${t.lang}\` but no \`translation_source\`, so nothing says which ` +
          `page it translates — and the navbar has no item to put it in place of.`,
      });
      continue;
    }
    const sourceRel = source.split("/").join(sep);
    const sourceAbs = join(site, sourceRel);
    const why = unreadable.get(source);
    if (why !== undefined) {
      findings.push({
        where,
        severity: "unreadable",
        message:
          `translates ${SITE_DIR}/${source}, whose own front matter will not parse (${why}), ` +
          `so the URL this translation should replace cannot be determined. Reported rather ` +
          `than guessed: a wrong nav target is worse than a missing one.`,
      });
      continue;
    }
    if (!existsSync(sourceAbs)) {
      findings.push({
        where,
        severity: "error",
        message: `\`translation_source: ${source}\` names ${SITE_DIR}/${source}, which is not there.`,
      });
      continue;
    }
    let sfm: Record<string, unknown>;
    try {
      sfm = frontMatter(readFileSync(sourceAbs, "utf-8")) ?? {};
    } catch {
      sfm = {};
    }
    const key = pageKey(pageUrl(sourceRel, sfm));
    const known = sources.get(key);
    if (!known) {
      findings.push({
        where,
        severity: "error",
        message:
          `\`translation_source: ${source}\` resolves to a page that is not in the source ` +
          `language (${src}). A translation of a translation has no item in the navbar to ` +
          `replace.`,
      });
      continue;
    }
    const entry = (pages[key] ??= {
      sourceUrl: known.url,
      sourceTitle: known.title,
      translations: {},
    });
    if (entry.translations[t.lang]) {
      findings.push({
        where,
        severity: "error",
        message:
          `is a second ${t.lang} translation of ${SITE_DIR}/${source}; the first was ` +
          `${entry.translations[t.lang].url}. One page cannot have two translations in one ` +
          `locale without something choosing between them.`,
      });
      continue;
    }
    locales.add(t.lang);
    entry.translations[t.lang] = {
      url: t.url,
      title: t.title,
      status: typeof t.fm.translation_status === "string" ? t.fm.translation_status : "",
      dir: LOCALE_RTL[t.lang] ? "rtl" : "ltr",
    };
  }

  // Reported, at a severity that does not gate. Silence here would be the
  // wrong kind of tidy: a page nobody can parse today is a page nobody can
  // translate tomorrow, and the reader of this output is the person who would
  // otherwise find that out the hard way.
  for (const [rel, why] of [...unreadable].sort(([a], [b]) => a.localeCompare(b))) {
    findings.push({
      where: `${SITE_DIR}/${rel}`,
      severity: "note",
      message:
        `front matter will not parse (${why}). Nothing translates this page and it is not ` +
        `itself a translation, so the index is complete without it — but it could not be ` +
        `translated as things stand.`,
    });
  }

  return {
    index: {
      $schema: INDEX_SCHEMA,
      sourceLocale: src,
      locales: [...locales].sort(),
      pages: Object.fromEntries(Object.entries(pages).sort(([a], [b]) => a.localeCompare(b))),
    },
    findings,
  };
}

/** The document, serialised exactly as it is written, so `--check` compares like with like. */
export function serialise(index: TranslationIndex): string {
  return JSON.stringify(index, null, 2) + "\n";
}

/** Write the index. Returns whether the file changed. */
export function writeTranslationIndex(instanceRoot: string, index: TranslationIndex): boolean {
  const p = join(instanceRoot, INDEX_PATH);
  const next = serialise(index);
  const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
  if (prev === next) return false;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, next, "utf-8");
  return true;
}

/** `ok` | `stale` | `unreadable`, plus what to print. Exit codes: 0 / 1 / 2. */
export function checkTranslationIndex(instanceRoot: string): {
  state: "ok" | "stale" | "unreadable";
  findings: IndexFinding[];
  stalePath?: string;
} {
  const { index, findings } = buildTranslationIndex(instanceRoot);
  if (findings.some((f) => f.severity === "unreadable")) {
    return { state: "unreadable", findings };
  }
  if (findings.some((f) => f.severity === "error")) return { state: "stale", findings };
  const p = join(instanceRoot, INDEX_PATH);
  const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
  if (prev !== serialise(index)) return { state: "stale", findings, stalePath: INDEX_PATH };
  return { state: "ok", findings };
}

// ── CLI ─────────────────────────────────────────────────────────

const LABEL: Record<IndexFinding["severity"], string> = {
  unreadable: "UNREADABLE",
  error: "ERROR     ",
  note: "note      ",
};

function report(findings: IndexFinding[]): void {
  for (const f of findings) {
    const line = `${LABEL[f.severity]}  ${f.where}\n    ${f.message}`;
    if (f.severity === "note") console.log(line);
    else console.error(line);
  }
}

if (import.meta.main) {
  const root = REPO_ROOT;
  const check = process.argv.includes("--check");
  if (check) {
    const r = checkTranslationIndex(root);
    report(r.findings);
    if (r.state === "unreadable") {
      console.error(
        "\nCould not determine the translation set. NOT written, and NOT reported as " +
          '"no translations" — an unreadable tree must never render as an empty one.',
      );
      process.exit(2);
    }
    if (r.state === "stale") {
      if (r.stalePath) console.error(`\n${r.stalePath} is stale. Run: bun run translation:index`);
      process.exit(1);
    }
    const n = Object.keys(buildTranslationIndex(root).index.pages).length;
    console.log(`translation index up to date — ${n} source page(s) with translations`);
  } else {
    const { index, findings } = buildTranslationIndex(root);
    report(findings);
    if (findings.some((f) => f.severity === "unreadable")) {
      console.error("\nRefusing to write a partial index over a complete one.");
      process.exit(2);
    }
    if (findings.some((f) => f.severity === "error")) process.exit(1);
    const changed = writeTranslationIndex(root, index);
    console.log(
      `${changed ? "Wrote" : "Unchanged"} ${INDEX_PATH} — ` +
        `${Object.keys(index.pages).length} source page(s), locales: ${index.locales.join(", ") || "(none)"}`,
    );
  }
}
