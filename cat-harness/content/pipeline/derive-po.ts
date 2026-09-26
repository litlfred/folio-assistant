#!/usr/bin/env bun
/**
 * Recover a `.po` catalogue from a page that is ALREADY TRANSLATED.
 *
 * Issue #206, and the blocker it left on `main`: five pages were published in
 * five locales with no catalogue, `translation-drift` fails on every one, and
 * the owner ruled against recording the absences — *"ask the `t8g3` campaign for
 * the actual `.po` catalogues rather than record their absence"* (bean `ngxj`).
 * The catalogues are the fix. This derives the ones that can be derived
 * SOUNDLY, and refuses the rest loudly.
 *
 * ## The registry says this cannot be done, and it is nearly right
 *
 * `translation-drift.ts` records, as the reason two pages sit in `UNCATALOGED`:
 *
 * > A catalogue cannot be derived from a finished translation without inventing
 * > the segmentation
 *
 * That is true of a translation you can only read as prose. It is NOT true when
 * the SAME deterministic extractor runs on both sides: `extractMarkdown` walks
 * headings, paragraphs, list items, blockquotes and table cells in document
 * order, so a translation that preserves its source's structure yields the same
 * sequence of constructs. Pairing by position is then reading one segmentation,
 * not inventing a second.
 *
 * **The whole question is whether the structure IS preserved, and that is what
 * this module refuses on.**
 *
 * ## Why the check is the KIND SEQUENCE and not the count
 *
 * A count match is not an alignment, and on this corpus that was not academic.
 * Before the extractor fixes below, `fr/accessibility` and `ru/getting-started`
 * matched their source's entry count EXACTLY and each diverged in kind partway
 * through — at construct 32 and 53, a source `paragraph` against a translated
 * `table-cell`. A count-only check would have written two catalogues pairing a
 * paragraph's msgid with a table cell's text, and nothing downstream would have
 * noticed: a `.po` is well-formed whatever it claims.
 *
 * ## What the refusals turned out to be ABOUT, measured twice
 *
 * A refusal says the two documents are not the same shape. It does **not** say
 * the translator restructured the page, and reading it that way was wrong for
 * some of them. Two properties of `pot-extract.ts` were not locale-neutral:
 *
 * - **`MD_MIN_TEXT_LEN` was a minimum in CHARACTERS** (bean `6b8u`). Stripping
 *   code spans left `", "` (2) in English and `"، و"` (3) in Arabic, so an
 *   identical 4x7 table yielded 66 constructs in `ar` against 65. It ran the
 *   other way for dense scripts, where `否` is one character and was dropped
 *   while `non` and `нет` were kept. Now a count of LETTERS.
 * - **A code fence was recognised only at column 0** (bean `ig4a`), so an
 *   indented fence inside a list item was not a fence and its body was
 *   extracted as prose.
 *
 * | | pairs aligned |
 * |---|---|
 * | before either fix | **7** / 25 |
 * | after both | **10** / 25 |
 *
 * **The first account of this said 9 more, and that was wrong.** It inferred the
 * number by stitching together a count measurement and a kind measurement taken
 * separately. Measured directly on the thing that matters — count and kind
 * together — the two fixes unlock **three**. Pinned by a test, so the claim
 * cannot drift back.
 *
 * The 15 that still refuse are all `count-differs`; no pair diverges by kind any
 * more. A **third** extractor property is implicated in three of them and is
 * deliberately NOT fixed here: blockquotes are extracted one entry per LINE, so
 * the count depends on hard-wrap width, which no translator preserves.
 * Coalescing contiguous blockquote lines takes alignment to 13/25, unlocking
 * exactly `es`/`fr`/`ru` `installation`. Its own bean, because it changes what a
 * blockquote msgid IS and would rewrite existing catalogues' entries rather than
 * add and remove them.
 *
 * **The kind check is vindicated either way.** Whatever the cause, those two
 * pairs WERE misaligned, and a count-only check would have shipped them.
 *
 * ## What a matching kind sequence does NOT prove
 *
 * It is necessary, not sufficient. Two adjacent paragraphs could have swapped
 * and the sequence would still match. This is stated rather than hidden because
 * a caller deciding whether to trust the output needs it: what the tool
 * establishes is that the two documents have the same SHAPE, and it infers
 * correspondence from that plus the fact that these translations were produced
 * from these sources. A human sign-off is what turns that into an official
 * translation — #206's own distinction, and the reason every catalogue written
 * here is marked unofficial in its header.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { extractMarkdown, type PotEntry } from "./pot-extract.ts";
import { catalogueFor } from "./translation-drift.ts";
import { siteRoot } from "./translation-index.ts";

/** Why a pair could not be derived — never just "failed". */
export interface Refusal {
  page: string;
  locale: string;
  reason: "source-missing" | "translation-missing" | "count-differs" | "kind-diverges";
  detail: string;
}

export interface Derivation {
  page: string;
  locale: string;
  entries: number;
  po: string;
}

export interface DeriveResult {
  derived: Derivation[];
  refused: Refusal[];
}

/**
 * Locale names for the `.po` header, matching the existing catalogues' style
 * (`Language-Team: Arabic`).
 *
 * A literal map rather than `Intl.DisplayNames` because the header is a
 * committed artefact: a runtime-derived name would change the file when the ICU
 * data behind it changes, and a catalogue that rewrites itself on a node upgrade
 * is a diff nobody can review.
 */
export const LOCALE_NAMES: Record<string, string> = {
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  ru: "Russian",
  zh: "Chinese",
};

/** The first index where two entry lists disagree on kind, or `-1`. */
export function firstKindDivergence(src: PotEntry[], tr: PotEntry[]): number {
  const n = Math.min(src.length, tr.length);
  for (let i = 0; i < n; i += 1) {
    if (src[i].kind !== tr[i].kind) return i;
  }
  return -1;
}

/** Escape a string for a `.po` literal. */
function poEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * The catalogue text for one aligned pair.
 *
 * **Marked unofficial, in the header, unconditionally.** #206 defines official
 * as "human adjudication/sign-off has happened" and unofficial as agentic; a
 * catalogue recovered by a script is the latter, and a reader opening the file
 * should not have to infer that from its provenance. The marker is a comment
 * rather than a `.po` field so that `msgfmt` and every existing consumer are
 * unaffected.
 */
export function formatDerivedPo(
  page: string,
  locale: string,
  src: PotEntry[],
  tr: PotEntry[],
  sourcePath: string,
): string {
  const name = LOCALE_NAMES[locale] ?? locale;
  const out: string[] = [
    `# ${name} translation of folio-assistant ${page} (${sourcePath})`,
    "# Copyright (C) 2026 folio-assistant contributors",
    "# This file is distributed under the same license as the folio-assistant package.",
    "#",
    "# UNOFFICIAL — recovered from the already-published translation by",
    "# `content/pipeline/derive-po.ts`, by aligning this locale's page against its",
    "# source with the same extractor. No human has adjudicated it. Issue #206",
    "# defines official as human sign-off; until that happens this is a starting",
    "# point, not an authority. The alignment was accepted because the two",
    `# documents yield the same sequence of ${src.length} constructs; see the module`,
    "# docblock for what that does and does not establish.",
    "#",
    'msgid ""',
    'msgstr ""',
    '"Project-Id-Version: folio-assistant\\n"',
    '"Report-Msgid-Bugs-To: \\n"',
    `"Last-Translator: folio-assistant agent (derived, unofficial)\\n"`,
    `"Language-Team: ${name}\\n"`,
    `"Language: ${locale}\\n"`,
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
    "",
  ];
  // Deduplicate by msgid, keeping the FIRST translation seen. A repeated msgid
  // with two different translations cannot both be right, and gettext permits
  // only one — so the duplicate is dropped rather than silently overwriting,
  // and the count in the header stays the count of constructs rather than of
  // emitted entries.
  const seen = new Set<string>();
  for (let i = 0; i < src.length; i += 1) {
    const id = src[i].msgid;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(`#: ${sourcePath}:${src[i].line}`);
    out.push(`msgid "${poEscape(id)}"`);
    out.push(`msgstr "${poEscape(tr[i].msgid)}"`);
    out.push("");
  }
  return out.join("\n");
}

/**
 * Try to derive every (page, locale) catalogue, writing none.
 *
 * Separated from the writer so the decision is testable without a disk, the
 * split `resolveWithin`/`resolveFile` makes for the same reason.
 */
export function derive(
  instanceRoot: string,
  pages: string[],
  locales: string[],
  opts: { docsDir?: string } = {},
): DeriveResult {
  // `siteRoot` rather than a `docs` literal: two directories in this instance
  // declare that path (`docs` instance-scoped, `root-docs` repository-scoped),
  // so `directoryForGraph` would throw on the ambiguity — and `siteRoot`
  // CONFIRMS the directory by finding `_config.yml` in it rather than scanning
  // whatever is there. `opts.docsDir` is what the tests pass, and it is why a
  // fixture needs no `_config.yml`.
  const docs = opts.docsDir ?? siteRoot(instanceRoot);
  if (docs === undefined) {
    // Not "no pages found" — a missing site is a different fact from an empty
    // one, and reporting it as the latter is the `dh4f` defect: a consumer that
    // scans nothing and calls the run clean.
    return {
      derived: [],
      refused: pages.flatMap((page) =>
        locales.map((locale) => ({
          page,
          locale,
          reason: "source-missing" as const,
          detail: `no site root under ${instanceRoot} — nothing declares a directory with a _config.yml`,
        })),
      ),
    };
  }
  const derived: Derivation[] = [];
  const refused: Refusal[] = [];

  for (const page of pages) {
    const srcPath = join(docs, `${page}.md`);
    if (!existsSync(srcPath)) {
      for (const locale of locales) {
        refused.push({ page, locale, reason: "source-missing", detail: `no ${srcPath}` });
      }
      continue;
    }
    const rel = `${relative(instanceRoot, docs) || "."}/${page}.md`;
    const src = extractMarkdown(readFileSync(srcPath, "utf-8"), rel);

    for (const locale of locales) {
      const trPath = join(docs, locale, `${page}.md`);
      if (!existsSync(trPath)) {
        refused.push({ page, locale, reason: "translation-missing", detail: `no ${trPath}` });
        continue;
      }
      const tr = extractMarkdown(
        readFileSync(trPath, "utf-8"),
        `${relative(instanceRoot, docs) || "."}/${locale}/${page}.md`,
      );
      if (tr.length !== src.length) {
        refused.push({
          page,
          locale,
          reason: "count-differs",
          detail: `source has ${src.length} translatable constructs, the translation has ${tr.length}`,
        });
        continue;
      }
      const at = firstKindDivergence(src, tr);
      if (at !== -1) {
        refused.push({
          page,
          locale,
          reason: "kind-diverges",
          detail:
            `same count (${src.length}) but the structures differ: at construct ${at} the source is ` +
            `a ${src[at].kind} and the translation is a ${tr[at].kind}`,
        });
        continue;
      }
      derived.push({
        page,
        locale,
        entries: src.length,
        po: formatDerivedPo(page, locale, src, tr, rel),
      });
    }
  }
  return { derived, refused };
}

/**
 * Write what `derive` produced. Returns the paths written.
 *
 * The destination comes from `catalogueFor` in `translation-drift.ts` — the same
 * function the GATE uses to decide whether a catalogue exists. A second answer
 * here could put a file somewhere the gate does not look, which is a catalogue
 * that is written and still reported missing.
 */
export function write(instanceRoot: string, r: DeriveResult, translationsDir?: string): string[] {
  const written: string[] = [];
  for (const d of r.derived) {
    const out =
      translationsDir === undefined
        ? catalogueFor(instanceRoot, d.locale, d.page)
        : join(translationsDir, d.locale, `${d.page}.po`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, d.po, "utf-8");
    written.push(out);
  }
  return written;
}

export function formatReport(r: DeriveResult): string {
  const out: string[] = [];
  out.push(`Derived ${r.derived.length} catalogue(s); refused ${r.refused.length}.`);
  out.push("");
  for (const d of r.derived) {
    out.push(`  ✓ ${d.locale}/${d.page}  ${d.entries} entries`);
  }
  if (r.refused.length > 0) {
    out.push("");
    out.push("  REFUSED — each is a real finding about the translation, not a tool limit:");
    for (const f of r.refused) {
      out.push(`  ✗ ${f.locale}/${f.page}  [${f.reason}] ${f.detail}`);
    }
    out.push("");
    out.push("  A refusal means the published translation does not have the same SHAPE as its");
    out.push("  source, so no positional alignment is sound. That is drift the missing catalogue");
    out.push("  was hiding: `translation-drift` can only report \"no catalogue\" until one exists.");
  }
  return out.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const root = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
  const pages = ["accessibility", "content-types", "contributing", "getting-started", "installation"];
  const locales = ["ar", "es", "fr", "ru", "zh"];
  const r = derive(root, pages, locales);
  console.log(formatReport(r));
  if (argv.includes("--write")) {
    const w = write(root, r);
    console.log(`\nWrote ${w.length} file(s).`);
  } else {
    console.log("\n(dry run — pass --write to create the catalogues)");
  }
  // Exit 0 either way: a refusal is a fact about the corpus, not a failure of
  // this tool, and the caller that matters is a person reading the report.
  process.exit(0);
}
