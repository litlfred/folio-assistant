/**
 * Per-block translation QA sidecars — `<stem>.<locale>.translation-qa.json`.
 *
 * `translation-qa-sweep.ts` answers a different question: how much of the docs
 * SITE exists in each language. That is page coverage, and it is what the badge
 * under a page title reports. Nothing measured a BLOCK, so the per-block
 * translation icon had nothing to open — every block on the site reads
 * `TR ·`, honestly, because no such sidecar has ever existed.
 *
 * One sidecar per (block, locale), in the `block-qa/v1` entry shape so the
 * witness reader in `qa-witness.ts` serves both families without a second
 * projection to keep in step. Per locale rather than per block, mirroring
 * `translations/<locale>/`: a block translated into French and not into Arabic
 * has one verdict, not a merged one.
 *
 * ## What this can establish, and what it deliberately does not
 *
 * Three criteria are deterministic, reproducible, and worth a script witness:
 *
 * | criterion | what it measures |
 * |---|---|
 * | `translation-coverage` | how many of the block's extracted strings carry a non-empty translation |
 * | `translation-terms-preserved` | acronyms, numbers and URLs that must survive translation, and did not |
 * | `translation-not-echo` | a "translation" byte-identical to its source — the untranslated passthrough |
 *
 * `translation-semantic-roundtrip` is declared **with no entry at all**, and
 * that is the point rather than an omission.
 *
 * A round trip asks whether the MEANING survived, by translating back with a
 * translator that has not seen the original. Nothing here can do that. The only
 * back-translation available offline is reversing the PO's own msgid→msgstr
 * map, which returns the source **exactly, always** — a similarity of 1.0 that
 * measures the lookup table, not the translation. A score computed that way
 * would be a verdict with a script's name on it and no content, which is worse
 * than the gap: a reader who sees a green round-trip stops asking.
 *
 * The existing page-level numbers show the shape of that error from the other
 * side. `translations/fr/index.ts` records `roundTripQA: { fail: 21, total: 36,
 * method: "jaccard-word-overlap" }` and its own description explains the
 * failures away as expected "with limited vocabulary back-translator" — a
 * measurement whose author already knows it is about the instrument. That
 * number is not evidence about the translation, and copying it per block would
 * have spread it rather than fixed it.
 *
 * So the criterion appears in the sidecar carrying no witness, and the panel
 * says "no witness recorded — nobody has ruled on it". When an LLM or a human
 * back-translates, their entry appends here as an `agent` or `human` witness
 * beside the script ones, which is what the shared shape is for. Bean `ktt2`.
 *
 * ## A block with no translation gets NO sidecar, not a failing one
 *
 * A resolved PO that contains none of a block's strings means the block has not
 * been translated — not that its translation is 0% complete. Writing `fail` there
 * would paint every untranslated block red on a site that is 3% translated, and
 * bury the blocks whose translation exists and is broken. Absence stays
 * absence: no sidecar, and the icon reads `TR ·` — not swept.
 *
 * Usage:
 *   bun run content/pipeline/translation-block-qa.ts                 # write
 *   bun run content/pipeline/translation-block-qa.ts --check         # fail if stale
 *   bun run content/pipeline/translation-block-qa.ts --root <dir> --locales fr,es
 *
 * @module content/pipeline/translation-block-qa
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

import type { QaCriterionEntry, QaFieldHash, QaReviewer } from "../../schemas/block-qa.ts";
import { parsePo } from "./po-inject.ts";
import { resolvePoSources } from "./po-resolve.ts";
import { extractMarkdown } from "./pot-extract.ts";
import { gitFileCommitSha, gitHeadSha, hashFile, walkBlocks } from "./qa-utils.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const SELF = "content/pipeline/translation-block-qa.ts";

/** The criteria this sweep writes, and the one it deliberately leaves open. */
export const TRANSLATION_CRITERIA = [
  "translation-coverage",
  "translation-terms-preserved",
  "translation-not-echo",
  "translation-semantic-roundtrip",
] as const;

/**
 * A translation verdict's inputs: the block's own companions, plus the `.po`.
 *
 * Widened HERE rather than by adding `po` to `COMPANION_ROLES`, deliberately.
 * That list gates criterion APPLICABILITY across every adapter — a role added
 * to it is a role `hashBlockFiles` walks and `depends_on` can name for every
 * block in every folio. The PO is a companion of a (block, LOCALE) pair, not of
 * the block, so the roles list is the wrong place for it and widening it there
 * would be a schema change reaching well past this sweep.
 */
export type TranslationFieldHash = QaFieldHash & { po?: string };

/** A block-qa entry whose hashed inputs include the PO. */
export type TranslationQaEntry = Omit<QaCriterionEntry, "field_hash"> & {
  field_hash: TranslationFieldHash;
};

export interface TranslationBlockQaReport {
  $schema: "translation-qa/v1";
  /** `trans:<locale>/<stem>`, the convention `schemas/translation.ts` fixes. */
  label: string;
  /** The content block this translates, by ITS label — a different identity. */
  block?: string;
  locale: string;
  /** Repo-relative paths of the block's files. */
  paths: { md: string; ts?: string };
  /** The PO this verdict was measured against, repo-relative. */
  po: string;
  source_hashes: TranslationFieldHash;
  criteria: Record<string, TranslationQaEntry[]>;
  updated_at: string;
}

/**
 * Tokens that must survive a translation unchanged.
 *
 * Acronyms (`CRDM`, `QA`, `FHIR`), numbers, and URLs. A translator that drops
 * `CRDM` from a sentence about CRDM has lost the term the sentence is about,
 * and this is exactly the class a fluent mistranslation passes — the reason
 * bean `ktt2` argues for a round trip rather than a forward fluency check. It
 * is a floor, not a substitute for one.
 */
export function invariantTokens(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) out.add(m[0]);
  for (const m of text.matchAll(/\b[A-Z]{2,}(?:-[A-Z0-9]+)*\b/g)) out.add(m[0]);
  for (const m of text.matchAll(/\b\d+(?:[.,]\d+)*\b/g)) out.add(m[0]);
  return [...out].sort();
}

/** Normalised equality, for spotting a msgstr that is just the msgid back. */
function isEcho(msgid: string, msgstr: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  return norm(msgid) === norm(msgstr);
}

interface Measured {
  total: number;
  translated: number;
  echoed: number;
  missingTerms: string[];
}

/** Measure one block's strings against one locale's merged PO map. */
export function measureBlock(md: string, source: string, po: Map<string, string>): Measured {
  const entries = extractMarkdown(md, source);
  const m: Measured = { total: entries.length, translated: 0, echoed: 0, missingTerms: [] };
  for (const e of entries) {
    const msgstr = po.get(e.msgid);
    if (!msgstr || msgstr.trim() === "") continue;
    m.translated++;
    if (isEcho(e.msgid, msgstr)) m.echoed++;
    for (const tok of invariantTokens(e.msgid)) {
      // An acronym that is a real word in the target language may legitimately
      // be recased, so the comparison is case-sensitive only for the token as
      // written — a dropped token is the finding, not a re-spelled one.
      if (!msgstr.includes(tok)) {
        m.missingTerms.push(`${tok} — absent from: "${msgstr.slice(0, 80)}"`);
      }
    }
  }
  return m;
}

function reviewer(): QaReviewer {
  return {
    kind: "script",
    id: SELF,
    version: "v1",
    script_hash: hashFile(join(REPO_ROOT, SELF)),
    script_commit_sha: gitFileCommitSha(SELF, REPO_ROOT),
  };
}

function entry(
  result: QaCriterionEntry["result"],
  fieldHash: TranslationFieldHash,
  extra: Partial<QaCriterionEntry> = {},
): TranslationQaEntry {
  return {
    field_hash: fieldHash,
    result,
    reviewer: reviewer(),
    reviewed_at: new Date().toISOString(),
    reviewed_sha: gitHeadSha(REPO_ROOT),
    ...extra,
  };
}

/** Build the report for one (block, locale), or `undefined` if untranslated. */
export function buildReport(
  blockMd: string,
  label: string,
  locale: string,
  poPaths: string[],
): TranslationBlockQaReport | undefined {
  if (poPaths.length === 0) return undefined;
  const merged = new Map<string, string>();
  for (const p of poPaths) {
    // Later sources override earlier ones for the same msgid — the order
    // `resolvePoSources` returns them in, which is the pipeline's rule.
    for (const [k, v] of parsePo(readFileSync(p, "utf-8"))) merged.set(k, v);
  }
  const md = readFileSync(blockMd, "utf-8");
  const rel = relative(REPO_ROOT, blockMd);
  const m = measureBlock(md, rel, merged);
  // Nothing of this block is in the PO: it is untranslated, which is an absence
  // and not a failing translation. See the header.
  if (m.translated === 0) return undefined;

  const stem = basename(blockMd).replace(/\.md$/, "");
  const tsPath = blockMd.replace(/\.md$/, ".ts");
  const poRel = relative(REPO_ROOT, poPaths[poPaths.length - 1]!);
  const hashes: TranslationFieldHash = {
    md: hashFile(blockMd),
    ts: existsSync(tsPath) ? hashFile(tsPath) : undefined,
    po: hashFile(poPaths[poPaths.length - 1]!),
  };
  const fieldHash = { ...hashes };

  const pct = m.total === 0 ? 0 : Math.round((m.translated / m.total) * 100);
  const criteria: Record<string, TranslationQaEntry[]> = {};

  criteria["translation-coverage"] = [
    entry(pct === 100 ? "pass" : pct >= 50 ? "warn" : "fail", fieldHash, {
      severity: pct === 100 ? undefined : pct >= 50 ? "minor" : "major",
      metrics: { translated: m.translated, total: m.total, pct },
      notes:
        pct === 100
          ? undefined
          : `${m.total - m.translated} of ${m.total} strings carry no translation in this locale.`,
    }),
  ];

  criteria["translation-terms-preserved"] = [
    entry(m.missingTerms.length === 0 ? "pass" : "fail", fieldHash, {
      severity: m.missingTerms.length === 0 ? undefined : "major",
      // The structured evidence shape, which `qa-witness` flattens for the
      // panel — `evidence` is `string | {line?, text?}[]`, never `string[]`.
      evidence: m.missingTerms.length > 0 ? m.missingTerms.map((t) => ({ text: t })) : undefined,
      metrics: { checked: m.translated, missing: m.missingTerms.length },
    }),
  ];

  criteria["translation-not-echo"] = [
    entry(m.echoed === 0 ? "pass" : "warn", fieldHash, {
      severity: m.echoed === 0 ? undefined : "minor",
      metrics: { echoed: m.echoed, translated: m.translated },
      notes:
        m.echoed === 0
          ? undefined
          : `${m.echoed} string(s) are byte-identical to the source. That is right for a ` +
            `proper noun and wrong for a sentence, which is why this warns rather than fails.`,
    }),
  ];

  // Declared, deliberately unwitnessed. See the header: the only offline
  // back-translation is the PO read backwards, which measures the lookup table.
  criteria["translation-semantic-roundtrip"] = [];

  return {
    $schema: "translation-qa/v1",
    // Two identities, not one: `trans:fr/overview` names the translation node,
    // `sec:crdm-overview` names the block it translates. Folding the block's
    // label into the translation's produced `trans:fr/sec:crdm-overview`, which
    // matches neither convention.
    label: `trans:${locale}/${stem}`,
    block: label || undefined,
    locale,
    paths: { md: rel, ts: existsSync(tsPath) ? relative(REPO_ROOT, tsPath) : undefined },
    po: poRel,
    source_hashes: hashes,
    criteria,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fold a fresh sweep into what is already in the sidecar, without destroying
 * anybody else's ruling.
 *
 * This sweep owns exactly what IT wrote: entries whose reviewer is this script.
 * Those are replaced, because a re-run supersedes its own previous measurement
 * (bean `oja4` — append-only script entries make a sidecar grow a history of
 * one checker arguing with itself). Everything else is carried through:
 *
 *  - an `agent` or `human` entry on a criterion this sweep also measures;
 *  - every entry on a criterion this sweep does not produce at all, which is
 *    how `translation-semantic-roundtrip` keeps the round-trip verdict an
 *    adjudicating agent recorded. Writing `[]` over it would have deleted the
 *    only witness the criterion will ever have, on the next unrelated re-run,
 *    with nothing in the output to say so.
 *
 * Order matters and is not incidental: the FIRST entry is the operative verdict
 * everywhere in this repo. A fresh script measurement leads on the criteria it
 * owns; on a criterion it does not measure, whatever ruled stays first.
 */
export function mergeCriteria(
  existing: Record<string, TranslationQaEntry[]> | undefined,
  fresh: Record<string, TranslationQaEntry[]>,
): Record<string, TranslationQaEntry[]> {
  const out: Record<string, TranslationQaEntry[]> = {};
  const mine = (e: TranslationQaEntry) => e.reviewer?.kind === "script" && e.reviewer?.id === SELF;
  for (const [id, entries] of Object.entries(fresh)) {
    const kept = (existing?.[id] ?? []).filter((e) => !mine(e));
    out[id] = [...entries, ...kept];
  }
  for (const [id, entries] of Object.entries(existing ?? {})) {
    if (!(id in out)) out[id] = entries;
  }
  return out;
}

/**
 * Whether a rewritten sidecar differs in SUBSTANCE from the one on disk.
 *
 * Timestamps move on every run, so comparing the whole file would report every
 * sidecar stale forever and make `--check` useless. Verdicts, metrics, evidence
 * and the input hashes are what a reader acts on; `reviewed_at` is not.
 */
export function substantive(doc: TranslationBlockQaReport): string {
  const strip = (e: TranslationQaEntry) => ({
    result: e.result,
    severity: e.severity,
    evidence: e.evidence,
    metrics: e.metrics,
    notes: e.notes,
    field_hash: e.field_hash,
    // `script_hash` IS substantive: the checker's logic changing is exactly what
    // makes a recorded verdict worth re-establishing, and leaving it out let an
    // edited checker keep its predecessor's hash in every sidecar. The commit
    // SHA is not — it moves when nothing about the logic did.
    reviewer: {
      kind: e.reviewer?.kind,
      id: e.reviewer?.id,
      version: e.reviewer?.version,
      script_hash: e.reviewer?.script_hash,
    },
  });
  return JSON.stringify({
    label: doc.label,
    locale: doc.locale,
    po: doc.po,
    source_hashes: doc.source_hashes,
    criteria: Object.fromEntries(
      Object.entries(doc.criteria).map(([k, v]) => [k, v.map(strip)]),
    ),
  });
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const root = join(REPO_ROOT, arg("root", join("content", "docs")));
  const locales = arg("locales", "ar,zh,fr,ru,es")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let written = 0;
  let stale = 0;
  let skipped = 0;

  for (const block of walkBlocks(root, { includeUnlabelled: true, verify: false })) {
    if (!block.md || !existsSync(block.md)) continue;
    const stem = basename(block.md).replace(/\.md$/, "");
    const chapterSlug = basename(join(block.md, ".."));
    for (const locale of locales) {
      const sources = resolvePoSources({
        folioRoot: REPO_ROOT,
        locale,
        blockStem: stem,
        chapterSlug,
      }).map((s) => s.path);
      const doc = buildReport(block.md, block.label ?? stem, locale, sources);
      const out = block.md.replace(/\.md$/, `.${locale}.translation-qa.json`);
      if (!doc) {
        // An existing sidecar whose translation has gone is REPORTED, never
        // silently deleted: a verdict about a PO nobody can find any more is a
        // thing a person should look at, not something a sweep decides.
        if (existsSync(out)) {
          console.error(`  ! ${relative(REPO_ROOT, out)} has no PO source any more`);
          stale++;
        }
        skipped++;
        continue;
      }
      const current = existsSync(out)
        ? (JSON.parse(readFileSync(out, "utf-8")) as TranslationBlockQaReport)
        : undefined;
      doc.criteria = mergeCriteria(current?.criteria, doc.criteria);
      const body = JSON.stringify(doc, null, 2) + "\n";
      if (current && substantive(current) === substantive(doc)) continue;
      if (check) {
        console.error(`  ✗ ${relative(REPO_ROOT, out)} is stale`);
        stale++;
        continue;
      }
      writeFileSync(out, body);
      written++;
      const cov = doc.criteria["translation-coverage"]?.[0]?.metrics;
      console.log(`  ✓ ${relative(REPO_ROOT, out)} (${cov?.translated}/${cov?.total} strings)`);
    }
  }

  if (check && stale > 0) {
    console.error(
      `\n${stale} sidecar(s) stale — run: bun run ${SELF}`,
    );
    process.exit(1);
  }
  console.log(
    check
      ? "\ntranslation sidecars are up to date"
      : `\nWrote ${written} sidecar(s); ${skipped} (block, locale) pair(s) have no translation`,
  );
}
