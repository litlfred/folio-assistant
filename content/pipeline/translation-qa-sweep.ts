/**
 * Translation coverage QA sweep — reports translation status for all docs pages.
 *
 * Scans all Markdown files under `docs/` and reports which pages have
 * translations, which don't, and overall coverage per locale. Results
 * are written to `docs/_data/translation-qa.json` so Jekyll can render
 * them, and to stdout for CI/agent consumption.
 *
 * This is a "sidecar" in spirit — it records the translation coverage
 * state alongside the content, enabling the QA badge to show whether
 * the sweep has been run and what it found.
 *
 * Usage:
 *   bun run content/pipeline/translation-qa-sweep.ts          # run + write
 *   bun run content/pipeline/translation-qa-sweep.ts --check  # check only
 *   bun run content/pipeline/translation-qa-sweep.ts --json   # JSON output
 *
 * @module content/pipeline/translation-qa-sweep
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { availableLocales } from "./po-resolve";
import { siteDirFor } from "../../schemas/cat-harness.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const DOCS_DIR = join(REPO_ROOT, siteDirFor(REPO_ROOT));
const DATA_DIR = join(DOCS_DIR, "_data");
const OUTPUT_FILE = join(DATA_DIR, "translation-qa.json");

// Default supported locales (minus source)
const DEFAULT_LOCALES = ["ar", "zh", "fr", "ru", "es"];

interface PageTranslationStatus {
  /** Page path relative to docs/ */
  page: string;
  /** Source language */
  sourceLang: string;
  /** Available translated locales */
  availableLocales: string[];
  /** Target locales (minus source) */
  targetLocales: string[];
  /** Coverage: available / target count */
  coveragePct: number;
  /** Whether this page has any front matter lang field */
  hasLangField: boolean;
}

interface TranslationQaSweepResult {
  /** ISO timestamp of the sweep */
  sweptAt: string;
  /** Total docs pages scanned */
  totalPages: number;
  /** Pages with at least one translation */
  pagesWithTranslations: number;
  /** Pages with no translations */
  pagesWithoutTranslations: number;
  /** Per-locale coverage counts */
  localeCoverage: Record<string, { available: number; total: number; pct: number }>;
  /** Per-page status */
  pages: PageTranslationStatus[];
  /** Whether the sweep completed fully */
  complete: boolean;
}

/**
 * Extract front matter from a Markdown file.
 */
function extractFrontMatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      fm[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
    }
  }
  return fm;
}

/**
 * Find all non-translated Markdown pages under docs/.
 * Excludes locale subdirectories (fr/, ar/, etc.)
 */
function findSourcePages(): string[] {
  const pages: string[] = [];

  function walk(dir: string, depth: number) {
    if (depth > 3) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip locale subdirectories and special dirs
        if (DEFAULT_LOCALES.includes(entry.name)) continue;
        if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
        if (entry.name === "assets" || entry.name === "vendor") continue;
        walk(fullPath, depth + 1);
      } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
        pages.push(fullPath);
      }
    }
  }

  walk(DOCS_DIR, 0);
  return pages.sort();
}

/**
 * Run the translation QA sweep.
 */
export function runTranslationQaSweep(): TranslationQaSweepResult {
  const pages = findSourcePages();
  const results: PageTranslationStatus[] = [];
  const localeCounts: Record<string, { available: number; total: number }> = {};

  for (const locale of DEFAULT_LOCALES) {
    localeCounts[locale] = { available: 0, total: 0 };
  }

  for (const pagePath of pages) {
    const content = readFileSync(pagePath, "utf-8");
    const fm = extractFrontMatter(content);
    const relPath = relative(DOCS_DIR, pagePath);

    // Derive stem for translation lookup
    const stem = basename(relPath, ".md");
    const locales = availableLocales(REPO_ROOT, stem);
    const hasLangField = "lang" in fm;

    const status: PageTranslationStatus = {
      page: relPath,
      sourceLang: fm.lang || "en",
      availableLocales: locales,
      targetLocales: DEFAULT_LOCALES,
      coveragePct: DEFAULT_LOCALES.length > 0
        ? Math.round((locales.length / DEFAULT_LOCALES.length) * 100)
        : 100,
      hasLangField,
    };

    results.push(status);

    for (const locale of DEFAULT_LOCALES) {
      localeCounts[locale].total++;
      if (locales.includes(locale)) {
        localeCounts[locale].available++;
      }
    }
  }

  const localeCoverage: Record<string, { available: number; total: number; pct: number }> = {};
  for (const [locale, counts] of Object.entries(localeCounts)) {
    localeCoverage[locale] = {
      ...counts,
      pct: counts.total > 0 ? Math.round((counts.available / counts.total) * 100) : 0,
    };
  }

  return {
    sweptAt: new Date().toISOString(),
    totalPages: pages.length,
    pagesWithTranslations: results.filter((r) => r.availableLocales.length > 0).length,
    pagesWithoutTranslations: results.filter((r) => r.availableLocales.length === 0).length,
    localeCoverage,
    pages: results,
    complete: true,
  };
}

// ── CLI ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const jsonOnly = process.argv.includes("--json");
  const checkOnly = process.argv.includes("--check");

  const result = runTranslationQaSweep();

  if (jsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n🌐 Translation QA sweep — ${result.sweptAt}\n`);
    console.log(`Total pages:     ${result.totalPages}`);
    console.log(`With translations: ${result.pagesWithTranslations}`);
    console.log(`Without:           ${result.pagesWithoutTranslations}`);
    console.log();

    console.log("Per-locale coverage:");
    for (const [locale, cov] of Object.entries(result.localeCoverage)) {
      const bar = cov.pct > 0 ? "█".repeat(Math.round(cov.pct / 5)) : "░";
      console.log(`  ${locale}: ${cov.available}/${cov.total} (${cov.pct}%) ${bar}`);
    }
    console.log();

    // Pages without translations
    const noTrans = result.pages.filter((p) => p.availableLocales.length === 0);
    if (noTrans.length > 0) {
      console.log(`Pages without any translations (${noTrans.length}):`);
      for (const p of noTrans) {
        const langTag = p.hasLangField ? "" : " (no lang field)";
        console.log(`  · ${p.page}${langTag}`);
      }
    }
    console.log();

    // Pages with translations
    const hasTrans = result.pages.filter((p) => p.availableLocales.length > 0);
    if (hasTrans.length > 0) {
      console.log(`Pages with translations (${hasTrans.length}):`);
      for (const p of hasTrans) {
        console.log(`  ✓ ${p.page} — ${p.availableLocales.join(", ")} (${p.coveragePct}%)`);
      }
    }
  }

  // Write data file for Jekyll
  if (!checkOnly) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2) + "\n");
    if (!jsonOnly) {
      console.log(`\nWrote ${OUTPUT_FILE}`);
    }
  }

  // Exit with code for CI
  if (checkOnly && result.pagesWithTranslations === 0) {
    process.exit(1);
  }
}
