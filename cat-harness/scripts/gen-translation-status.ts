/**
 * The translation status page — what the gettext side actually covers.
 *
 * @module scripts/gen-translation-status
 * @covers translation-sources
 *
 * Bean `lnur`. Owner, 2026-09-21: *"need translation status visualtion page,
 * translations/ needs to be a declared sub-graph/dir of cat-harness and is
 * missing its visualtion, json(ld) and such"*.
 *
 * ## Half of that was already true, and the half that was not is this file
 *
 * `translations/` IS a declared sub-graph — id `translation-sources`, declared
 * 2026-09-19. What it lacked is a `coverage.visualiser` and a published
 * projection, which `kg:audit` already reported: cat-harness declares several
 * graphs with no published viewer and this was one.
 *
 * ## Why this is not a `state-visualizer` dashboard
 *
 * `state-visualizer.ts` draws a page for every declared STATE graph, asking
 * `isStateGraph(kind)`. `translation-sources` is not state — it is the INPUT
 * to injection, authored and read — so that generator correctly skips it and
 * always will. A viewer for it has to be its own, which is why this exists
 * rather than a flag on that one.
 *
 * ## What it measures, and what it refuses to guess
 *
 * Two different questions, and collapsing them is the thing to avoid:
 *
 *   1. IS THERE A CATALOGUE AT ALL? `.pot` templates are what CAN be
 *      translated; `.po` catalogues are what somebody started. A locale with
 *      63 templates and 3 catalogues is 5% reachable before a single string
 *      is looked at, and a page that reported only string percentages would
 *      show that locale as nearly complete.
 *   2. OF THE CATALOGUES THAT EXIST, how much is translated, fuzzy, or empty.
 *
 * Reporting (2) without (1) is the failure mode this page exists to prevent.
 *
 * Every number is DERIVED from the files on each run. Nothing here is written
 * down, and there is no baseline to go stale — the defect `d2kp` records,
 * where a page carrying its own measurement lied by aging.
 *
 * ## Paths come from the DECLARATION
 *
 * The translations directory is resolved from the instance's own
 * `<instance>.json` (`translation-sources`), and the site directory from
 * `siteDirFor`. Neither is written here. `site-dir-single-answer.test.ts`
 * guards the second across the whole tree and has already caught one set of
 * tests in this session hardcoding it.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { readDeclaration, siteDirFor } from "../schemas/cat-harness.js";
import { tileCounts } from "../schemas/tile-count.js";
import { withViewerNav, type ViewerNav } from "./viewer-page.ts";

const ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(ROOT, "..");

/** The projection's own tag. A file declares what it is — the contract
 *  `directory-conventions` states for every node here. */
export const TRANSLATION_STATUS_SCHEMA = "folio-translation-status/v1";

/** One catalogue's string counts. */
export interface CatalogueCounts {
  /** Entries with a non-empty `msgid`. The header entry is NOT one. */
  entries: number;
  /** Entries whose translation is non-empty and not fuzzy. */
  translated: number;
  /** Entries carrying the `fuzzy` flag — present, but needing review. */
  fuzzy: number;
  /** Entries with an empty translation. */
  untranslated: number;
}

export interface LocaleStatus extends CatalogueCounts {
  locale: string;
  /** `.pot` templates visible for this locale — what COULD be translated. */
  templates: number;
  /** `.po` catalogues present — what somebody started. */
  catalogues: number;
  /** Catalogues this run could not parse, by name. NEVER folded into a count. */
  unreadable: string[];
}

/**
 * Count the entries in a gettext `.po` catalogue.
 *
 * Hand-written rather than pulled from a library, and the reason is the one
 * this repository keeps paying: a dependency here would have to be added to
 * the CI image for a parse this small, and the awkward cases are few and
 * testable. They are ALL awkward, though, which is why this is exported and
 * has fixtures of its own rather than being a regex inline:
 *
 * - **The header entry has `msgid ""`** and a long `msgstr`. It is metadata,
 *   not a string anybody translates, and counting it inflates every locale by
 *   exactly one — invisibly, and in the direction that flatters.
 * - **`#, fuzzy` means present but unreviewed.** Counting it as translated is
 *   the single most misleading thing this parser could do, because fuzzy
 *   entries are precisely the ones a reviewer must look at.
 * - **Plurals** put the translation in `msgstr[0]`, `msgstr[1]`, … rather than
 *   `msgstr`. A parser that only knows `msgstr` reports every plural entry as
 *   untranslated.
 * - **Continuation lines** — a long string is written as several quoted lines
 *   after the keyword, so emptiness cannot be judged from the keyword's own
 *   line alone.
 */
export function countCatalogue(text: string): CatalogueCounts {
  const counts: CatalogueCounts = { entries: 0, translated: 0, fuzzy: 0, untranslated: 0 };

  // Entries are separated by blank lines. Splitting on them rather than
  // tracking state through the file keeps each entry independent, so one
  // malformed block cannot shift the interpretation of the rest.
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const isFuzzy = lines.some((l) => /^#,/.test(l) && /\bfuzzy\b/.test(l));

    // The value of a keyword is its own quoted part plus every bare quoted
    // continuation line that follows it.
    const valueOf = (keyword: RegExp): string | undefined => {
      const i = lines.findIndex((l) => keyword.test(l));
      if (i === -1) return undefined;
      const first = /"((?:[^"\\]|\\.)*)"/.exec(lines[i] ?? "");
      let v = first?.[1] ?? "";
      for (let j = i + 1; j < lines.length; j++) {
        const cont = /^\s*"((?:[^"\\]|\\.)*)"\s*$/.exec(lines[j] ?? "");
        if (!cont) break;
        v += cont[1];
      }
      return v;
    };

    const msgid = valueOf(/^\s*msgid\s/);
    if (msgid === undefined) continue;
    // The header. `msgid ""` with no plural is metadata, never a string.
    if (msgid === "") continue;

    counts.entries += 1;

    // Plural forms live in `msgstr[n]`; a singular entry uses `msgstr`. Taking
    // whichever is present means a plural entry is judged on its forms rather
    // than on a `msgstr` it does not have.
    const plural = lines.some((l) => /^\s*msgstr\[\d+\]/.test(l));
    const filled = plural
      ? lines.some((l) => {
          const m = /^\s*msgstr\[\d+\]\s*"((?:[^"\\]|\\.)*)"/.exec(l);
          return m !== null && m[1] !== "";
        })
      : (valueOf(/^\s*msgstr\s/) ?? "") !== "";

    if (isFuzzy) counts.fuzzy += 1;
    else if (filled) counts.translated += 1;
    else counts.untranslated += 1;
  }
  return counts;
}

/** Every file under `dir` with one of `exts`, recursively. */
function filesUnder(dir: string, exts: readonly string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesUnder(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

/**
 * Where the gettext sources are, READ from the declaration.
 *
 * Returns undefined when the instance declares no such directory — which is a
 * real state for a folio that has no translations, and is reported rather
 * than treated as an empty one.
 */
export function translationsDirOf(root: string): string | undefined {
  const decl = readDeclaration(root);
  const entry = decl?.directories?.find((d) => (d.graphKinds ?? []).includes("translation-sources"));
  return entry === undefined ? undefined : join(root, entry.path);
}

export function localeStatuses(translationsDir: string): LocaleStatus[] {
  const out: LocaleStatus[] = [];
  for (const locale of readdirSync(translationsDir).sort()) {
    const dir = join(translationsDir, locale);
    if (!statSync(dir).isDirectory()) continue;

    const status: LocaleStatus = {
      locale,
      templates: filesUnder(dir, [".pot"]).length,
      catalogues: 0,
      entries: 0,
      translated: 0,
      fuzzy: 0,
      untranslated: 0,
      unreadable: [],
    };

    for (const po of filesUnder(dir, [".po"])) {
      status.catalogues += 1;
      let text: string;
      try {
        text = readFileSync(po, "utf-8");
      } catch {
        // NAMED, never counted as zero. A catalogue that cannot be read is
        // "could not determine" for that file, and folding it into the
        // untranslated count would report a definite answer this run does
        // not have — the rule `ci-health` states and this repo holds
        // everywhere.
        status.unreadable.push(relative(translationsDir, po));
        continue;
      }
      const c = countCatalogue(text);
      status.entries += c.entries;
      status.translated += c.translated;
      status.fuzzy += c.fuzzy;
      status.untranslated += c.untranslated;
    }
    out.push(status);
  }
  return out;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `n` of `d` as a percentage, or `null` when there is nothing to divide by. */
export function share(n: number, d: number): number | null {
  return d === 0 ? null : Math.round((n / d) * 1000) / 10;
}

/**
 * The same artefact with every ISO date blanked, for comparison only.
 *
 * `changedAt` is the ONE date either artefact carries, and it is rendered in
 * both — so blanking `\d{4}-\d{2}-\d{2}` reaches exactly it. Nothing else
 * here is a date: the locales are names and every other figure is a count.
 * If a date is ever added to the page for its own sake, this becomes too
 * blunt and the comparison has to name the field instead.
 *
 * It is what makes `changedAt` mean what it says. A re-run that reproduces
 * the same numbers leaves the file alone, so the date on the page is the day
 * the measurement last MOVED rather than the day somebody last ran a script
 * — which is the more useful of the two, and the only one a committed
 * artefact can state honestly.
 */
function undated(text: string): string {
  return text.replace(/\d{4}-\d{2}-\d{2}/g, "<date>");
}

/** A share for display. `null` is "no basis", NEVER "0%". */
function pct(v: number | null): string {
  return v === null ? '<span class="ts-none">no basis</span>' : `${v}%`;
}

export function statusPage(doc: {
  locales: LocaleStatus[];
  changedAt: string;
  /** The ONE declared directory measured, repo-relative. See the page note. */
  scope: string;
}): string {
  const rows = doc.locales
    .map((l) => {
      const unread =
        l.unreadable.length === 0
          ? ""
          : `<div class="ts-warn">${l.unreadable.length} catalogue(s) unreadable: ` +
            `${esc(l.unreadable.join(", "))}</div>`;
      return `<tr>
  <th scope="row"><code>${esc(l.locale)}</code></th>
  <td>${l.catalogues} / ${l.templates}<br><span class="ts-dim">${pct(share(l.catalogues, l.templates))}</span></td>
  <td>${l.entries}</td>
  <td>${l.translated}<br><span class="ts-dim">${pct(share(l.translated, l.entries))}</span></td>
  <td>${l.fuzzy}</td>
  <td>${l.untranslated}${unread}</td>
</tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>translations — status</title>
<!--
  Generated by scripts/gen-translation-status.ts. Do not hand-edit: the next
  run overwrites it, \`translation:status:check\` fails on the difference, and
  a hand-edit is a change nothing else in the tree knows about.

  RENDERED SERVER-SIDE, with no JavaScript. The numbers are known at generate
  time and a table has no interaction to speak of, so fetching them would buy
  nothing and cost the accessibility floor every page here is held to — the
  same reasoning \`state-visualizer\` gives for its QA table.
-->
<style>
:root { --ts-bg: #0d0d0d; --ts-ink: #ffffff; --ts-dim: #c3c2b7; --ts-line: #3a3a3a; --ts-warn: #f0b429; }
:root[data-fa-scheme="light"] { --ts-bg: #f9f9f7; --ts-ink: #0b0b0b; --ts-dim: #52514e; --ts-line: #d3d3cd; --ts-warn: #8a6100; }
body { margin: 0; padding: 1.5rem clamp(1rem, 4vw, 3rem) 4rem; background: var(--ts-bg); color: var(--ts-ink);
       font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 60rem; margin: 0 auto; }
h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
.ts-sub { color: var(--ts-dim); margin: 0 0 1.5rem; font-size: 0.9rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid var(--ts-line); padding: 0.5rem 0.6rem; text-align: right; vertical-align: top; }
th[scope="row"], thead th:first-child { text-align: left; }
thead th { font-size: 0.8rem; color: var(--ts-dim); font-weight: 600; }
.ts-dim { color: var(--ts-dim); font-size: 0.8rem; }
.ts-none { color: var(--ts-dim); font-style: italic; }
.ts-warn { color: var(--ts-warn); font-size: 0.8rem; text-align: left; margin-top: 0.3rem; }
.ts-note { color: var(--ts-dim); font-size: 0.85rem; margin-top: 1.5rem; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
</head>
<body>
<main>
<h1>translations — status</h1>
<p class="ts-sub">The gettext side of the <code>translation-sources</code> graph, measured from the files in
<code>${esc(doc.scope)}</code>. Every number here is derived on each run; none is written down. These
numbers last <strong>changed</strong> on ${esc(doc.changedAt)}.</p>

<table>
<thead>
<tr>
  <th scope="col">locale</th>
  <th scope="col">catalogues / templates</th>
  <th scope="col">entries</th>
  <th scope="col">translated</th>
  <th scope="col">fuzzy</th>
  <th scope="col">untranslated</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<p class="ts-note"><strong>Two questions, not one.</strong> <em>catalogues / templates</em> asks whether a
<code>.po</code> exists at all for each extractable <code>.pot</code>; the string columns ask how much of
the catalogues that DO exist is done. A locale can be near 100% translated across a handful of catalogues
while most of its templates have none — which is why the first column is not folded into the rest.</p>

<p class="ts-note"><strong>&ldquo;no basis&rdquo; is not zero.</strong> A share over an empty denominator is
undefined, and rendering it as 0% would report a measurement this run did not make.</p>

<p class="ts-note"><strong>One directory, named above.</strong> <code>translation-sources</code> is a graph
KIND, and more than one instance may declare it; this page measures the one directory named in the subtitle
and says nothing about any other. A catalogue sitting in an instance that has not declared it is invisible
here — which is a gap in that declaration rather than a locale with no work done, and the two must not read
the same.</p>

<p class="ts-note"><strong>Fuzzy is counted apart from translated.</strong> A fuzzy entry has a translation
and needs review; adding it to <em>translated</em> would flatter exactly the entries a reviewer must look at.</p>
</main>
</body>
</html>
`;
}

function main(): void {
  const check = process.argv.includes("--check");
  const translationsDir = translationsDirOf(ROOT);

  if (translationsDir === undefined || !existsSync(translationsDir)) {
    // COULD NOT DETERMINE, and exit 2 so it is never read as a clean run.
    // An instance with no translation-sources directory is a real state; this
    // generator is not the thing that decides it means "no translations".
    console.error("gen-translation-status: no `translation-sources` directory is declared or present.");
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }

  const locales = localeStatuses(translationsDir);
  const site = join(ROOT, siteDirFor(ROOT));

  // The projection first, the page second: the page is a rendering OF the
  // projection, and writing them the other way round invites a page whose
  // numbers no file backs.
  const doc = {
    $schema: TRANSLATION_STATUS_SCHEMA,
    // WHEN THE NUMBERS LAST CHANGED, which is not when the generator last
    // ran — see `undated` below. Filled in after the comparison, because a
    // re-run that reproduces the same numbers must not move it.
    changedAt: "",
    // WHAT WAS MEASURED, in the projection and not only on the page. A reader
    // of the JSON has the same right to know the scope as a reader of the
    // table, and a number whose subject is implicit is the one that gets
    // quoted somewhere else as though it covered everything.
    scope: relative(REPO_ROOT, translationsDir),
    // The tile's headline number — #863, and it is `locales` because that is
    // what THIS PAGE shows: one row per locale, which the rendered table has
    // six of, being five locales and a header. The badge mechanism rests on a
    // count being the count of the page its tile opens, and every other number
    // here would break it. `templates` (61–64) and `entries` (85–171) both
    // VARY BY LOCALE, so neither is a property of the page at all;
    // `untranslated` is reported per row, and a tile carrying it would answer
    // a question the page answers five times over.
    //
    // The key is `translation-sources` — the id of the DIRECTORY the tile was
    // declared for (`translations/`) — and not this projection's own segment.
    // `scanTileCounts` reads whatever a projection names, so what it names has
    // to be the directory, which is the half a reader gets wrong first.
    ...tileCounts({
      "translation-sources": [locales.length, locales.length === 1 ? "locale" : "locales"],
    }),
    locales,
  };

  const assetDir = join(site, "assets", "translation-status");
  const pageDir = join(site, "translation-status");
  const assetPath = join(assetDir, "index.json");
  const pagePath = join(pageDir, "index.html");

  // THE NAVBAR COMES WITH THE PAGE — bean `edx7`. Applied inside `page` rather
  // than at the write, because the staleness comparison below runs on this
  // same function's output: railing after the comparison would leave the gate
  // green over a page that gains its rail only when somebody re-runs this.
  const nav: ViewerNav = { built: basename(ROOT), docsRoot: site };
  const page = (changedAt: string) => {
    const html = statusPage({ locales, changedAt, scope: doc.scope });
    return withViewerNav(html, pagePath, nav) ?? html;
  };
  const json = (changedAt: string) => `${JSON.stringify({ ...doc, changedAt }, null, 2)}\n`;

  const today = new Date().toISOString().slice(0, 10);

  let stale = 0;
  for (const [p, render] of [
    [assetPath, json],
    [pagePath, page],
  ] as const) {
    const have = existsSync(p) ? readFileSync(p, "utf-8") : null;
    // COMPARED WITHOUT THE DATE, and then written WITH it. Comparing the
    // rendered date would make this gate fail on the calendar: the artefact
    // would go stale at midnight with not one catalogue touched, and CI would
    // be red on every branch until somebody re-ran a generator that changes
    // one line. A gate that fails for a reason nobody can act on is a gate
    // people learn to re-run rather than read.
    if (have !== null && undated(have) === undated(render(today))) continue;
    stale += 1;
    if (check) {
      console.error(`  ✗ ${relative(REPO_ROOT, p)} is stale`);
    } else {
      mkdirSync(join(p, ".."), { recursive: true });
      writeFileSync(p, render(today));
      console.log(`  ✓ ${relative(REPO_ROOT, p)}`);
    }
  }

  const totals = locales.reduce(
    (a, l) => ({
      templates: a.templates + l.templates,
      catalogues: a.catalogues + l.catalogues,
      entries: a.entries + l.entries,
      translated: a.translated + l.translated,
      unreadable: a.unreadable + l.unreadable.length,
    }),
    { templates: 0, catalogues: 0, entries: 0, translated: 0, unreadable: 0 },
  );
  console.log(
    `${locales.length} locale(s): ${totals.catalogues} catalogue(s) of ${totals.templates} template(s), ` +
      `${totals.translated} of ${totals.entries} string(s) translated` +
      (totals.unreadable > 0 ? `, ${totals.unreadable} unreadable` : ""),
  );

  if (check && stale > 0) {
    console.error("Run `bun run translation:status` and commit.");
    process.exit(1);
  }
}

if (import.meta.main) main();
