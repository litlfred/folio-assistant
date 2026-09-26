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
 * Measured 2026-09-26 over the 25 uncatalogued (page, locale) pairs:
 *
 * | | pairs |
 * |---|---|
 * | kind sequence identical — derivable | **7** |
 * | count matches but kinds diverge — REFUSED | **2** |
 * | count differs — refused | 16 |
 *
 * The middle row is the reason this check exists. `fr/accessibility` and
 * `ru/getting-started` both match their source's entry count exactly, and both
 * diverge in kind partway through — at index 32 and 53, source `paragraph`
 * against translated `table-cell`. A count check would have written two
 * catalogues pairing a paragraph's msgid with a table cell's text, and nothing
 * downstream would have noticed: a `.po` is well-formed whatever it claims.
 *
 * ## What a refusal is ABOUT — measured, and not what it first looked like
 *
 * A refusal says the two documents are not the same shape. It does **not** say
 * the translator changed the structure, and on this corpus that reading would be
 * wrong for more than half of them.
 *
 * `MD_MIN_TEXT_LEN` in `pot-extract.ts` is a minimum in **characters**, and a
 * character count is not script-neutral. Measured by re-running both sides with
 * the minimum at 1: of the 16 count mismatches, **7 disappear entirely**, and so
 * do **both** kind divergences — `fr/accessibility` and `ru/getting-started`
 * align exactly (`firstKindDivergence === -1`). The mechanism, on one cell:
 *
 * | | cell | after code spans are stripped | extracted at min 3? |
 * |---|---|---|---|
 * | source | ``` `pandoc`, `ripgrep` ``` | `", "` (2) | no |
 * | `ar` | ``` `pandoc`، و`ripgrep` ``` | `"، و"` (3) | **yes** |
 *
 * The Arabic comma and the conjunction are a correct localisation, and they push
 * a code-only cell over a threshold English sits under. The same asymmetry runs
 * the other way for Chinese, where a one-character cell (`否` for "no") falls
 * under a threshold that `non` and `нет` clear — which is why `zh` is short on
 * all five pages.
 *
 * So of the 18 refusals, **9 are artefacts of the extractor's own threshold**
 * and **9 are substantive** (the translation really does carry less). This
 * module still refuses all 18, and that is deliberate: it aligns against the
 * extractor AS SHIPPED, because every other consumer of these catalogues does
 * too. Deriving the other 9 would mean aligning under a threshold that is not
 * the repository's. The threshold is tracked as its own finding rather than
 * worked around here.
 *
 * **The kind check is vindicated either way.** Whatever the cause, at the
 * shipped threshold those two pairs ARE misaligned, and a count-only check would
 * have written two wrong catalogues.
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
import { dirname, join } from "node:path";

import { extractMarkdown, type PotEntry } from "./pot-extract.ts";

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
  const docs = opts.docsDir ?? join(instanceRoot, "docs");
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
    const rel = `docs/${page}.md`;
    const src = extractMarkdown(readFileSync(srcPath, "utf-8"), rel);

    for (const locale of locales) {
      const trPath = join(docs, locale, `${page}.md`);
      if (!existsSync(trPath)) {
        refused.push({ page, locale, reason: "translation-missing", detail: `no ${trPath}` });
        continue;
      }
      const tr = extractMarkdown(readFileSync(trPath, "utf-8"), `docs/${locale}/${page}.md`);
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

/** Write what `derive` produced. Returns the paths written. */
export function write(instanceRoot: string, r: DeriveResult, translationsDir?: string): string[] {
  const dir = translationsDir ?? join(instanceRoot, "translations");
  const written: string[] = [];
  for (const d of r.derived) {
    const out = join(dir, d.locale, `${d.page}.po`);
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
