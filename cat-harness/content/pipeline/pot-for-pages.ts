#!/usr/bin/env bun
/**
 * `.pot` templates for the published pages that have no catalogue.
 *
 * ## Why this exists, and what it deliberately does NOT do
 *
 * `translation:drift:check` fails on a page that is published in a locale with
 * no `.po` beside it. On 2026-09-26 that is **25** pages — the 5 × 5 grid of
 * `accessibility` / `content-types` / `contributing` / `getting-started` /
 * `installation` × `ar` / `es` / `fr` / `ru` / `zh` — and `main` carries that
 * red BY DECISION (bean `ngxj`, issue #206). The owner chose the remedy on
 * 2026-09-26: **get the catalogues authored**, not record their absence.
 *
 * **This does not turn the gate green, and must not be read as trying to.** A
 * `.pot` is a translator's INPUT; the gate wants a `.po`, which is a
 * translator's OUTPUT. What this removes is the reason a translator cannot
 * start: measured the same day, not one of those 25 pages had a `.pot` OR a
 * `.po` in any locale, so the campaign had nothing to be handed.
 *
 * Bean `f6r1` is why generating the `.po` is not on the table: of 27 such
 * translations, **19 are provably not derivable** from the published text (the
 * segment counts differ by ~20, so deriving would mean deciding which segments
 * went untranslated and which were merged) and 8 are undetermined, with 0
 * demonstrated derivable. Authoring is human work. Extraction is not.
 *
 * ## The page list is DERIVED, never written down here
 *
 * It comes from `translation-drift`'s own findings, so this cannot disagree
 * with the gate it exists to serve. A hardcoded list of five names would be a
 * second answer to "which pages need a catalogue", free to drift the moment one
 * is finished — and the whole subject here is a record going stale against a
 * corpus that moved on.
 *
 * ## Reuses the extractor, adds nothing to it
 *
 * `extractMarkdown` + `formatPot` from `pot-extract.ts`, called the same way
 * the `translation_extract` MCP tool calls them. That tool could already do
 * this one page at a time; what was missing was a runnable entry point over
 * the SET the gate names, which is why this is 40 lines and not a parser.
 *
 * Usage:
 *   bun run translation:pot              # write a .pot per (locale, page) needing one
 *   bun run translation:pot -- --check   # exit 1 if any is missing or stale
 *   bun run translation:pot -- --json    # the plan, written nowhere
 *
 * Exit: 0 wrote or all current, 1 `--check` found one missing or stale,
 *       2 could not determine — the drift report named no page.
 *
 * @module content/pipeline/pot-for-pages
 * @covers cat-harness
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { directoryForGraph, siteDirFor } from "../../schemas/cat-harness.js";
import { extractMarkdown, formatPot, potWithoutTimestamp } from "./pot-extract.js";
import { driftFor } from "./translation-drift.js";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Where a translator's `.pot` and `.po` live.
 *
 * declared-path-literal: the convention fallback is stated at the call site,
 * the same shape `translation.ts` and `translation-drift.ts` use, so the choice
 * is visible rather than buried in the accessor.
 */
function translationsRoot(root: string): string {
  return directoryForGraph(root, "translation-sources") ?? join(root, "translations");
}

/**
 * The English source a locale's page is a translation OF.
 *
 * `siteDirFor`, not a `docs` literal. The site root is ONE answer and a second
 * copy is free to disagree with it — `site-dir-single-answer` refuses the
 * literal, and it refused this one: I wrote `join(root, "docs", ...)` here and
 * the test caught it, which is the third time in this session's work that the
 * same invariant caught the same reflex.
 */
export function sourceFor(root: string, page: string): string {
  return join(siteDirFor(root), `${page}.md`);
}

export interface PotPlan {
  locale: string;
  page: string;
  /** Absolute path of the `.pot` to write. */
  pot: string;
  /** The English source it is extracted from. */
  source: string;
  /** False when the source page does not exist — reported, never invented. */
  sourceExists: boolean;
  /** Already present and byte-equal apart from its timestamp. */
  current: boolean;
}

/**
 * The (locale, page) pairs the gate reports as published with no catalogue.
 *
 * Derived from `driftFor`'s own findings rather than from a list here, matched
 * on the message the checker itself emits — so a page that gains a `.po`
 * leaves this set without anybody editing it. The alternative, five names in a
 * constant, is a second answer to "which pages need a catalogue", and this
 * whole subject is a record going stale against a corpus that moved on.
 *
 * Only the NO-CATALOGUE findings: `driftFor` also reports structural drift,
 * which is a different defect with a different remedy and no `.pot` to write.
 */
export function needingCatalogue(root: string): Array<{ locale: string; page: string }> {
  return driftFor(root).findings
    .filter((f) => f.severity === "error" && f.message.includes("no `.po` catalogue"))
    .map((f) => {
      const [locale, ...rest] = f.subject.split("/");
      return { locale: locale!, page: rest.join("/") };
    })
    .filter((x) => x.locale.length > 0 && x.page.length > 0);
}

export function plan(root = INSTANCE_ROOT): PotPlan[] {
  const dir = translationsRoot(root);
  return needingCatalogue(root).map(({ locale, page }) => {
    const source = sourceFor(root, page);
    const pot = join(dir, locale, `${page}.pot`);
    const sourceExists = existsSync(source);
    let current = false;
    if (sourceExists && existsSync(pot)) {
      const fresh = formatPot(extractMarkdown(readFileSync(source, "utf-8"), relative(root, source)), {
        locale,
      });
      current = potWithoutTimestamp(readFileSync(pot, "utf-8")) === potWithoutTimestamp(fresh);
    }
    return { locale, page, pot, source, sourceExists, current };
  });
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const items = plan();

  if (items.length === 0) {
    console.error("UNDETERMINED: the drift report named no uncatalogued page.");
    console.error(
      "This is not a pass — nothing was planned. Either every published translation " +
        "has a catalogue (in which case say so from `translation:drift:check`, not from here) " +
        "or the report could not be read.",
    );
    process.exit(2);
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(items.map((i) => ({ ...i, pot: relative(INSTANCE_ROOT, i.pot) })), null, 2));
    process.exit(0);
  }

  const missingSource = items.filter((i) => !i.sourceExists);
  const stale = items.filter((i) => i.sourceExists && !i.current);

  console.log(`.pot templates for uncatalogued pages — ${items.length} (locale, page) pair(s)\n`);
  for (const i of missingSource) {
    console.log(`  ? ${i.locale}/${i.page}  — no English source at ${relative(INSTANCE_ROOT, i.source)}`);
  }
  if (check) {
    for (const i of stale) console.log(`  ✗ ${relative(INSTANCE_ROOT, i.pot)} — missing or stale`);
    if (stale.length === 0 && missingSource.length === 0) {
      console.log("  ✓ every uncatalogued page has a current .pot for a translator to work from");
    }
    console.log(
      "\n  A .pot is the INPUT. The gate wants a .po, which a person writes — " +
        "19 of 27 are provably not derivable (bean `f6r1`), so this cannot and does not " +
        "turn `translation:drift:check` green.",
    );
    if (stale.length > 0) process.exit(1);
    process.exit(0);
  }

  let wrote = 0;
  for (const i of items) {
    if (!i.sourceExists) continue;
    if (i.current) continue;
    mkdirSync(dirname(i.pot), { recursive: true });
    const entries = extractMarkdown(readFileSync(i.source, "utf-8"), relative(INSTANCE_ROOT, i.source));
    writeFileSync(i.pot, formatPot(entries, { locale: i.locale }));
    console.log(`  wrote ${relative(INSTANCE_ROOT, i.pot)}  (${entries.length} string(s))`);
    wrote += 1;
  }
  console.log(
    `\n  ${wrote} template(s) written, ${items.length - wrote - missingSource.length} already current.\n\n` +
      "  NEXT, and it is not mine: a translator writes `<page>.po` beside each `.pot`.\n" +
      "  Until then `translation:drift:check` stays red, which is the chosen state\n" +
      "  (bean `ngxj`, issue #206) rather than a defect.",
  );
}
