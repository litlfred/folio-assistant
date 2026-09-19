/**
 * The translation index — which source page has a translation in which locale,
 * and where that translation is served from.
 *
 * This is the file the left-hand navbar reads to decide what to show. It is
 * generated into `docs/_data/translations.json`, published into every page by
 * `_includes/head_custom.html`, and consumed by `mountNavLocale` in
 * `docs/assets/js/docs-ui.js`.
 *
 * ## Where the directories come from, and where they emphatically do not
 *
 * **From the declaration.** `cat-harness.json` names each directory whose
 * graph kind is `translated-content` and states its `locale`. Nothing here
 * globs for directories, matches a name against a list of language subtags, or
 * reads `fr` out of a path.
 *
 * That is not fastidiousness. A name match is the "distinguishable by
 * extension … a coincidence of the current layout, not a contract" defect #263
 * named, moved to directory names, and it is wrong in BOTH directions: a folio
 * with a `no/` chapter (Norwegian, or the English word) is silently hidden from
 * its own navbar, and a `pt-BR/` or `translated-fr/` directory is silently
 * shown as source. Neither failure announces itself — the navbar simply has
 * the wrong entries in it, which is exactly the bug this file exists to fix.
 *
 * ## Two levels, each stating the fact it owns
 *
 * The DIRECTORY declares what to expect: `docs/fr/` holds French. The FILE
 * declares what it is: `lang: fr`, and `translation_source: index.md` naming
 * the page it expresses. Neither restates the other, so neither can drift from
 * the other — and {@link checkTranslationIndex} fails when they disagree,
 * which is what makes the split checked rather than merely intended.
 *
 * ## Three states, not two
 *
 * `--check` distinguishes:
 *
 * | state | meaning | exit |
 * |---|---|---|
 * | ok | the written index matches what the corpus says | 0 |
 * | stale / invalid | it does not, and here is which page | 1 |
 * | unreadable | a declared directory could not be read at all | 2 |
 *
 * The third is the one that matters. A declared directory that cannot be read
 * must NEVER be written into the index as "this locale has no pages" — the
 * navbar would then correctly render a complete absence of translations from
 * an incomplete read. Same rule as the README sections and the CI-health
 * report: could-not-determine is its own answer.
 *
 * Usage:
 *   bun run translation:index          # write docs/_data/translations.json
 *   bun run translation:index:check    # fail if stale, invalid, or unreadable
 *
 * @module content/pipeline/translation-index
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import {
  TRANSLATED_CONTENT_KIND,
  readDeclaration,
  type ContentDirectory,
} from "../../schemas/cat-harness.ts";
import { LOCALE_RTL } from "../../schemas/translation.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

/** Where the generated index lands, relative to the instance root. */
export const INDEX_PATH = join("docs", "_data", "translations.json");

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
 * Three severities, and the split between the last two is the whole
 * three-states rule made operational:
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
 * of them has a translation, so the index is exactly as complete without them
 * — escalating those to `unreadable` would fail the build over a fact the
 * index does not depend on, and a gate that fires on irrelevancies is a gate
 * people start passing with `--no-verify`.
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
export function pageUrl(relPathFromDocs: string, frontMatter: Record<string, unknown>): string {
  const pm = frontMatter.permalink;
  if (typeof pm === "string" && pm.length > 0) return pm.startsWith("/") ? pm : `/${pm}`;
  return "/" + relPathFromDocs.split(sep).join("/").replace(/\.md$/i, ".html");
}

// ── Front matter ────────────────────────────────────────────────

/**
 * The YAML front matter of a Markdown page, or `undefined` when there is none.
 *
 * Throws on malformed YAML rather than returning `{}`: a page whose front
 * matter will not parse is a page whose `lang` cannot be read, and treating
 * that as "declares nothing" is how an untranslated-looking French page ends
 * up back in the navbar.
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

/** Every `.md` under `dir`, recursively, repo-relative and sorted. */
function markdownFiles(root: string, dir: string): string[] {
  const out: string[] = [];
  const walk = (abs: string): void => {
    for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(abs, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && /\.md$/i.test(e.name)) out.push(relative(root, p));
    }
  };
  walk(dir);
  return out;
}

// ── Building ────────────────────────────────────────────────────

/** The declared directories holding translated content, in declaration order. */
export function translatedDirectories(instanceRoot: string): ContentDirectory[] {
  const decl = readDeclaration(instanceRoot);
  if (!decl) return [];
  return decl.directories.filter((d) => d.graphs.includes(TRANSLATED_CONTENT_KIND));
}

/** The instance's source language. `harness.config.json`, defaulting to `en`. */
export function sourceLocale(instanceRoot: string): string {
  const p = join(instanceRoot, "harness.config.json");
  if (!existsSync(p)) return "en";
  try {
    const cfg = JSON.parse(readFileSync(p, "utf-8")) as { translation?: { defaultLocale?: string } };
    return cfg.translation?.defaultLocale ?? "en";
  } catch {
    return "en";
  }
}

/**
 * Build the index from the declaration and the pages' own front matter.
 *
 * Never throws for content reasons: a corpus problem comes back as a finding
 * so the caller can report every one of them, rather than the first.
 */
export function buildTranslationIndex(instanceRoot: string): BuildResult {
  const findings: IndexFinding[] = [];
  const src = sourceLocale(instanceRoot);
  const docsRoot = join(instanceRoot, "docs");
  const pages: Record<string, IndexedPage> = {};
  const locales = new Set<string>();
  const declaredDirs = translatedDirectories(instanceRoot);

  // Source pages, so a translation can be matched to one and a fallback item
  // can carry the source title. Read once, keyed the same way.
  const declaredAbs = declaredDirs.map((d) => resolve(instanceRoot, d.path));
  const insideDeclared = (abs: string): boolean =>
    declaredAbs.some((d) => abs === d || abs.startsWith(d.endsWith(sep) ? d : d + sep));

  const sourceByKey = new Map<string, { relPath: string; url: string; title: string }>();
  const translatedElsewhere: string[] = [];
  // Source pages whose front matter would not parse, keyed by their
  // docs-relative path — the spelling `translation_source` uses. Held rather
  // than reported: it only becomes a real gap if a translation names one.
  const unreadableSources = new Map<string, string>();
  if (existsSync(docsRoot)) {
    for (const rel of markdownFiles(docsRoot, docsRoot)) {
      const abs = join(docsRoot, rel);
      if (insideDeclared(abs)) continue;
      let fm: Record<string, unknown> | undefined;
      try {
        fm = frontMatter(readFileSync(abs, "utf-8"));
      } catch (e) {
        unreadableSources.set(
          rel.split(sep).join("/"),
          e instanceof Error ? e.message.split("\n")[0] : String(e),
        );
        continue;
      }
      if (!fm) continue;
      const lang = typeof fm.lang === "string" ? fm.lang : undefined;
      // A page declaring a non-source language OUTSIDE every declared
      // translated-content directory. This is the failure the declaration
      // exists to make impossible to ship quietly: with no entry in
      // `cat-harness.json` it is invisible to this index, so it stays in the
      // static nav and shows up under English — the reported bug, exactly.
      if (lang && lang !== src) {
        translatedElsewhere.push(join("docs", rel));
        continue;
      }
      const url = pageUrl(rel, fm);
      sourceByKey.set(pageKey(url), {
        relPath: join("docs", rel),
        url,
        title: typeof fm.title === "string" ? fm.title : rel,
      });
    }
  }

  for (const p of translatedElsewhere) {
    findings.push({
      where: p,
      severity: "error",
      message:
        `declares a non-source \`lang\` but sits outside every declared ` +
        `\`${TRANSLATED_CONTENT_KIND}\` directory, so nothing knows it is a translation ` +
        `and it stays in the navbar under the source language. Declare its directory in ` +
        `cat-harness.json with a \`locale\`.`,
    });
  }

  for (const dir of declaredDirs) {
    const abs = resolve(instanceRoot, dir.path);
    const locale = dir.locale as string; // the schema guarantees it on this kind
    if (!existsSync(abs)) {
      findings.push({
        where: dir.path,
        severity: "unreadable",
        message:
          `declared as \`${TRANSLATED_CONTENT_KIND}\` (${locale}) but the directory is not ` +
          `there. An absent directory and an empty one are indistinguishable to a consumer ` +
          `— which is the \`dh4f\` defect — so this is reported rather than indexed as ` +
          `"this locale has no pages".`,
      });
      continue;
    }
    let files: string[];
    try {
      files = markdownFiles(abs, abs);
    } catch (e) {
      findings.push({
        where: dir.path,
        severity: "unreadable",
        message: `could not be read: ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }
    locales.add(locale);
    for (const rel of files) {
      const fileRel = join(dir.path, rel).split(sep).join("/");
      let fm: Record<string, unknown> | undefined;
      try {
        fm = frontMatter(readFileSync(join(abs, rel), "utf-8"));
      } catch (e) {
        findings.push({
          where: fileRel,
          severity: "unreadable",
          message: `front matter will not parse: ${e instanceof Error ? e.message : String(e)}`,
        });
        continue;
      }
      if (!fm) {
        findings.push({
          where: fileRel,
          severity: "error",
          message: `no front matter, so it declares neither \`lang\` nor \`translation_source\`.`,
        });
        continue;
      }
      if (fm.lang !== locale) {
        findings.push({
          where: fileRel,
          severity: "error",
          message:
            `declares \`lang: ${String(fm.lang ?? "(none)")}\` but sits in a directory ` +
            `declared \`locale: ${locale}\`. The directory says what to expect and the file ` +
            `says what it is; when they disagree one of them is wrong and neither can be ` +
            `preferred silently.`,
        });
        continue;
      }
      // `nav_exclude` is what keeps the page out of the STATIC nav. Without it
      // just-the-docs lists the translation beside its source and the locale
      // filter has nothing to remove — the entries are already rendered.
      if (fm.nav_exclude !== true) {
        findings.push({
          where: fileRel,
          severity: "error",
          message:
            `is translated content but does not declare \`nav_exclude: true\`, so ` +
            `just-the-docs renders it into the navbar for every reader whatever locale ` +
            `they selected. The locale filter swaps nav items; it cannot un-render one.`,
        });
        continue;
      }
      // A translated page has no nav position of its own: it stands where its
      // SOURCE stands, because that is what "in place of" means. Leaving a
      // `nav_order` behind is two facts that disagree — one saying "put me at
      // 1.1", the other saying "do not list me" — and the next reader cannot
      // tell which is the intent.
      if (fm.nav_order !== undefined) {
        findings.push({
          where: fileRel,
          severity: "error",
          message:
            `declares \`nav_order: ${String(fm.nav_order)}\` as well as \`nav_exclude\`. A ` +
            `translated page takes its source page's position, because it replaces that item ` +
            `rather than joining the list. Remove the \`nav_order\`.`,
        });
        continue;
      }
      const source = typeof fm.translation_source === "string" ? fm.translation_source : "";
      if (!source) {
        findings.push({
          where: fileRel,
          severity: "error",
          message: `declares no \`translation_source\`, so nothing says which page it translates.`,
        });
        continue;
      }
      const sourceAbs = join(docsRoot, source);
      // The one case where an unparseable SOURCE page matters: a translation
      // names it, so its URL is load-bearing and cannot be determined.
      const why = unreadableSources.get(source.split(sep).join("/"));
      if (why !== undefined) {
        findings.push({
          where: fileRel,
          severity: "unreadable",
          message:
            `translates docs/${source}, whose own front matter will not parse (${why}), so ` +
            `the URL this translation should replace cannot be determined. Reported rather ` +
            `than guessed: a wrong nav target is worse than a missing one.`,
        });
        continue;
      }
      if (!existsSync(sourceAbs)) {
        findings.push({
          where: fileRel,
          severity: "error",
          message: `\`translation_source: ${source}\` names docs/${source}, which is not there.`,
        });
        continue;
      }
      let sfm: Record<string, unknown> | undefined;
      try {
        sfm = frontMatter(readFileSync(sourceAbs, "utf-8")) ?? {};
      } catch {
        sfm = {};
      }
      const key = pageKey(pageUrl(source, sfm));
      const known = sourceByKey.get(key);
      const entry = (pages[key] ??= {
        sourceUrl: known?.url ?? pageUrl(source, sfm),
        sourceTitle: known?.title ?? (typeof sfm.title === "string" ? sfm.title : source),
        translations: {},
      });
      if (entry.translations[locale]) {
        findings.push({
          where: fileRel,
          severity: "error",
          message:
            `is a second ${locale} translation of docs/${source}; the first was ` +
            `${entry.translations[locale].url}. One page cannot have two translations in ` +
            `one locale without something choosing between them.`,
        });
        continue;
      }
      entry.translations[locale] = {
        url: pageUrl(join(dir.path.replace(/^docs[/\\]?/, ""), rel), fm),
        title: typeof fm.title === "string" ? fm.title : rel,
        status: typeof fm.translation_status === "string" ? fm.translation_status : "",
        dir: LOCALE_RTL[locale] ? "rtl" : "ltr",
      };
    }
  }

  // Reported, at a severity that does not gate. Silence here would be the
  // wrong kind of tidy: a page nobody can parse today is a page nobody can
  // translate tomorrow, and the reader of this output is the person who would
  // otherwise find that out the hard way.
  for (const [rel, why] of [...unreadableSources].sort(([a], [b]) => a.localeCompare(b))) {
    findings.push({
      where: `docs/${rel}`,
      severity: "note",
      message:
        `front matter will not parse (${why}). No translation names this page, so the index ` +
        `is complete without it — but it could not be translated as things stand.`,
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
          '"no translations" — an unreadable directory must never render as an empty one.',
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
