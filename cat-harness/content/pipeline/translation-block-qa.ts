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
 * The page-level numbers that used to sit in `translations/fr/index.ts` showed
 * the shape of that error from the other side: `roundTripQA: { fail: 21,
 * total: 36, method: "jaccard-word-overlap" }`, scored against a
 * back-translation map holding 6 entries for 36 strings — so every string
 * nobody had back-translated came back at 0 similarity and was published as
 * drift, and the count was of absences. The field, those numbers and the two
 * scripts that wrote them are gone; there is nothing left to copy per block.
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

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import type { CompanionRole, QaCriterionEntry, QaFieldHash, QaReviewer, UntaintedDispatch } from "../../schemas/block-qa.ts";
import { parsePo, parsePoEntries } from "./po-inject.ts";
import { directoryForGraph } from "../../schemas/cat-harness.js";
import { resolvePoSources } from "./po-resolve.ts";
import { extractMarkdown } from "./pot-extract.ts";
import { gitFileCommitSha, gitHeadSha, hashFile, walkBlocks } from "./qa-utils.ts";
import { existingTranslationQaPath, translationQaPath } from "./qa-paths.ts";
import { sourceLocale, targetLocales } from "./translation-index.ts";
import { siteDirFor } from "../../schemas/cat-harness.ts";

const INSTANCE_ROOT = join(import.meta.dir, "..", "..");
/**
 * This sweep's identity AS A REVIEWER, written into every sidecar it touches.
 *
 * Instance-relative on purpose: it is a stable id recorded in committed data,
 * not a path anybody runs. Changing it would rewrite the `reviewer.id` of
 * every sidecar in the corpus.
 */
const SELF = "content/pipeline/translation-block-qa.ts";

/**
 * How a PERSON re-runs this, which is a different fact from {@link SELF}.
 *
 * Bean `b963`. The stale-sidecar message printed `bun run ${SELF}` — and from
 * the repository root, where a reader stands, `content/pipeline/…` does not
 * resolve. The instruction telling somebody how to fix the failure named a
 * path that does not exist, which is this bean's whole subject appearing in a
 * shape none of its three readers can see: the verb and the path are separated
 * by an interpolation, so no line carries both.
 *
 * A package script rather than a path, because a script name cannot rot when
 * the file moves — the same reason `docs:harness` replaced a path in
 * `sync-docs-harness.ts`.
 */
const RERUN_COMMAND = "bun run translation:block-qa";

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

/**
 * The artefact vocabulary a translation criterion's untainted dispatch ranges
 * over — the block's companions plus the `.po`.
 *
 * The same widening as {@link TranslationFieldHash}, for the same reason, and
 * it is why `untaintedPartitionDefects` takes its universe as a parameter
 * rather than reading `depends_on`: `po` is not a `CompanionRole` and must not
 * become one.
 */
export type TranslationArtefact = CompanionRole | "po";

/**
 * `translation-semantic-roundtrip` declared against the generic spine.
 *
 * This IS the round trip `translation-manager.md` describes, restated in the
 * vocabulary of `skills/folio-core/untainted-verification.md` — the first
 * instantiation of it, and the one that showed the spine's own abstraction was
 * a notch too narrow.
 *
 * Read the partition and the discipline falls out of it: the back-translator
 * is handed the `.po` and nothing else, so it cannot copy the source back; the
 * adjudicator is handed the `.md` and never the `.po`, so it rules on meaning
 * rather than talking itself into a reading of the French. The two visible
 * sets are disjoint, which is the whole rule in one line.
 */
export const ROUNDTRIP_DISPATCH: UntaintedDispatch<TranslationArtefact> = {
  // The target-language text, and nothing else.
  checker_sees: ["po"],
  // Shown the source, a back-translator writes the source back and the check
  // passes vacuously — measuring the lookup table rather than the translation.
  checker_withheld: ["md", "ts"],
  // The original, never the target.
  adjudicator_sees: ["md"],
  drift:
    "Synonyms, articles and re-ordering are NOT drift. A claim added, dropped, " +
    "weakened, strengthened or reversed IS; so is a term of art swapped for " +
    "something that means a different thing, and a named entity or quantifier " +
    "moved. Without both halves stated a round trip degenerates into a style " +
    "review and every translation fails.",
};

/** The artefacts a translation criterion's dispatch must account for. */
export const TRANSLATION_ARTEFACTS: readonly TranslationArtefact[] = ["md", "ts", "po"];

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
 * Tokens that should survive a translation, in TWO classes of confidence.
 *
 * ## Why the classes exist
 *
 * A URL or a number that changed is broken or false, in any language, with no
 * judgement required. An ACRONYM is a different thing entirely: a good
 * translation localises it. `WHO` is `OMS` in French and
 * `منظمة الصحة العالمية` in Arabic, and those are the organisation's name in
 * those languages, not a dropped term.
 *
 * Both were one list returning `fail` at `major` until bean `pp93` swept whole
 * docs pages for the first time and it fired on real translated prose. Measured
 * on `docs/index.md`: 4 locales `fail`, every finding an acronym the translator
 * had rendered correctly — `WHO` → `OMS`, `LLM` → `نموذج لغوي`, `HCI` expanded
 * in French. That would have shipped as the loudest thing on the most
 * translated page this site has, and a false verdict is worse than the silence
 * it replaces. It is the shape bean `ktt2` is about, arriving from the other
 * direction: a checker reporting what it did not measure.
 *
 * ## The fix is the severity, not the detection
 *
 * A missing acronym is still worth SEEING — a translator who silently dropped
 * `FHIR` from a sentence about FHIR has lost the term the sentence is about,
 * and that is exactly the class a fluent mistranslation passes. So it is still
 * reported, as a `warn` the reader is asked to judge, because the checker
 * genuinely cannot tell a correct localisation from a loss. `fail` is kept for
 * the class where it cannot be wrong.
 *
 * A glossary would settle the acronym case properly — `translations/<locale>/
 * glossary.po` already exists for exactly this kind of term — and that is worth
 * doing. Until then the criterion reports the confidence it actually has.
 */
export type InvariantClass = "strict" | "acronym";

export interface InvariantToken {
  token: string;
  /** `strict` — a URL or number, which cannot legitimately change.
   *  `acronym` — may be localised or expanded, so absence is a question. */
  kind: InvariantClass;
}

export function invariantTokens(text: string): InvariantToken[] {
  const out = new Map<string, InvariantClass>();
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) out.set(m[0], "strict");
  for (const m of text.matchAll(/\b\d+(?:[.,]\d+)*\b/g)) out.set(m[0], "strict");
  // Set last and only when unseen, so a token that is already `strict` — a
  // number inside a URL, say — is not demoted by the acronym pass.
  for (const m of text.matchAll(/\b[A-Z]{2,}(?:-[A-Z0-9]+)*\b/g)) {
    if (!out.has(m[0])) out.set(m[0], "acronym");
  }
  return [...out.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token, kind]) => ({ token, kind }));
}

/**
 * The terminology glossary for one locale — what a term is expected to become.
 *
 * ## Why the checker needs one
 *
 * `translation-terms-preserved` can see that `WHO` is absent from a French
 * translation. It cannot see whether that is `OMS` (correct) or a silently
 * dropped term (a real loss), so it warns on both — four unactionable warns on
 * `docs/index.md` alone, on a page whose translations are fine. Bean `he0e`.
 *
 * ## What an entry says, and what it deliberately does not
 *
 * `translations/<locale>/glossary.po`, the slot `schemas/translation.ts`
 * already declares ("shared glossary PO (no POT — hand-authored)"). Three
 * shapes, and the third is the one that matters:
 *
 * | entry | meaning | when the term is absent |
 * |---|---|---|
 * | `msgstr "OMS"` | the expected form, pinned | **fail** — the glossary said what it should be |
 * | `msgstr "FHIR"` (identity) | must survive verbatim | **fail** |
 * | `#, localised` | rendered in the target language, form NOT pinned | **pass** — absence is the expected outcome |
 * | absent from the glossary | unknown | **warn**, as before |
 *
 * **The third shape is why this needs no translated content.** Pinning forms
 * would mean authoring the Arabic, Chinese, Russian, Spanish and French of
 * every term — target-language material invented to quieten a checker, in a
 * repository whose first rule is that it holds no content. `#, localised` says
 * the one thing the checker actually needs and the one thing a reader of
 * English can review: *this term gets localised; I am not pinning how*. A folio
 * that wants the stricter check pins the form, and gets it.
 *
 * ## It cannot become a mute button
 *
 * A flag that made a criterion pass unconditionally would be a defect wearing a
 * glossary's clothes. `localised` only ever converts a would-be finding about
 * THAT term into a pass; it cannot suppress `strict` tokens (URLs, numbers),
 * cannot act on a term it does not name, and every locale's glossary is read
 * separately, so marking a term in French says nothing about Arabic.
 */
export interface GlossaryTerm {
  /** The expected form in this locale, when the glossary pins one. */
  expected?: string;
  /** The term is rendered in the target language; no form is pinned. */
  localised: boolean;
}

/** `<term> -> rule`, for one locale. Empty when the locale has no glossary. */
export type Glossary = Map<string, GlossaryTerm>;

/** The flag that marks a term as localised-without-a-pinned-form. */
const LOCALISED_FLAG = "localised";

export function readGlossary(folioRoot: string, locale: string): Glossary {
  const out: Glossary = new Map();
  // declared-path-literal: the convention fallback for a folio that declares no
  // `translation-sources` graph, matching `translationDir` in `po-resolve.ts`.
  // The declaration is asked FIRST and this is only reached when there is none.
  const dir = directoryForGraph(folioRoot, "translation-sources") ?? join(folioRoot, "translations");
  const path = join(dir, locale, "glossary.po");
  if (!existsSync(path)) return out;
  for (const e of parsePoEntries(readFileSync(path, "utf-8"))) {
    const term = e.msgid.trim();
    if (!term) continue;
    const localised = (e.flags ?? []).includes(LOCALISED_FLAG);
    const expected = e.msgstr.trim();
    out.set(term, { expected: expected || undefined, localised });
  }
  return out;
}

/**
 * What the glossary says about one absent token, if anything.
 *
 * `undefined` means the glossary does not name it, which is the `warn` the
 * criterion reported before any of this existed — an unnamed term is not
 * silently forgiven.
 */
function glossaryVerdict(
  g: Glossary,
  token: string,
  msgstr: string,
): { ok: boolean; why: string } | undefined {
  const rule = g.get(token);
  if (!rule) return undefined;
  if (rule.expected !== undefined) {
    return msgstr.includes(rule.expected)
      ? { ok: true, why: `rendered as "${rule.expected}", as the glossary pins it` }
      : { ok: false, why: `the glossary pins "${rule.expected}" for this locale, and it is absent too` };
  }
  if (rule.localised) {
    return { ok: true, why: "the glossary marks it localised, so an absent verbatim form is expected" };
  }
  // Named, but the entry says nothing: neither a form nor the flag. Treated as
  // unknown rather than as permission — an empty entry is an unfinished one.
  return undefined;
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
  /** Missing URLs and numbers — the class that cannot legitimately change. */
  missingStrict: string[];
  /** Missing acronyms the glossary does not name — still a question. */
  missingAcronyms: string[];
  /**
   * Missing acronyms the glossary ACCOUNTS FOR — reported, never a finding.
   *
   * Kept rather than dropped: "absent because the glossary says it is
   * localised" is a different fact from "present", and a reader auditing the
   * glossary needs to see which terms it is speaking for. A rule nobody can see
   * working is a rule nobody can tell is wrong.
   */
  resolvedAcronyms: string[];
  /** Missing acronyms whose glossary-pinned form is ALSO absent. A loss. */
  brokenGlossaryTerms: string[];
}

/** Measure one block's strings against one locale's merged PO map. */
export function measureBlock(
  md: string,
  source: string,
  po: Map<string, string>,
  glossary: Glossary = new Map(),
): Measured {
  const entries = extractMarkdown(md, source);
  const m: Measured = {
    total: entries.length, translated: 0, echoed: 0,
    missingStrict: [], missingAcronyms: [],
    resolvedAcronyms: [], brokenGlossaryTerms: [],
  };
  for (const e of entries) {
    const msgstr = po.get(e.msgid);
    if (!msgstr || msgstr.trim() === "") continue;
    m.translated++;
    if (isEcho(e.msgid, msgstr)) m.echoed++;
    for (const { token, kind } of invariantTokens(e.msgid)) {
      // An acronym that is a real word in the target language may legitimately
      // be recased, so the comparison is case-sensitive only for the token as
      // written — a dropped token is the finding, not a re-spelled one.
      if (msgstr.includes(token)) continue;
      const line = `${token} — absent from: "${msgstr.slice(0, 80)}"`;
      if (kind === "strict") {
        // A URL or a number. No glossary speaks for these: nothing localises
        // a `3`, and a changed URL is broken in every language.
        m.missingStrict.push(line);
        continue;
      }
      const said = glossaryVerdict(glossary, token, msgstr);
      if (said === undefined) m.missingAcronyms.push(line);
      else if (said.ok) m.resolvedAcronyms.push(`${token} — ${said.why}`);
      else m.brokenGlossaryTerms.push(`${token} — ${said.why}`);
    }
  }
  return m;
}

function reviewer(): QaReviewer {
  return {
    kind: "script",
    id: SELF,
    version: "v1",
    script_hash: hashFile(join(INSTANCE_ROOT, SELF)),
    script_commit_sha: gitFileCommitSha(SELF, INSTANCE_ROOT),
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
    reviewed_sha: gitHeadSha(INSTANCE_ROOT),
    ...extra,
  };
}

/**
 * Whether a PO is about THIS subject, according to the PO itself.
 *
 * ## The collision this exists to stop
 *
 * `resolvePoSources` finds a block-level PO by bare stem —
 * `translations/<locale>/<stem>.po`. A stem is not unique across directories,
 * and the first run of the page sweep proved it: `docs/cat-harness/index.md`
 * resolved to `translations/<locale>/index.po`, which belongs to
 * `docs/index.md`. One phrase appears on both pages, so the match was not
 * empty — it was 1 of 66 strings, and the sweep was about to publish five
 * locales of `translation-coverage: fail, 2%` about a page nobody has ever
 * translated. A false verdict is worse than the silence it replaces, and this
 * one would have been the loudest thing on the page.
 *
 * ## The PO already says, so this asks rather than infers
 *
 * gettext `#:` reference lines name the source each msgid came from, and
 * `parsePoEntries` keeps them. Three spellings are live in this corpus and all
 * three are accepted, because the reference is written by whatever produced the
 * POT and this module does not get to dictate that:
 *
 *   - `docs/index.md` — instance-relative, no line;
 *   - `content/docs/crdm-methodology/overview.md:1` — instance-relative, line;
 *   - `agent-onboarding.md:10` — bare basename, line.
 *
 * So the line suffix is stripped, and then the reference's OWN SHAPE decides
 * how it is matched. A reference carrying a directory is a path and must match
 * the subject's instance-relative path exactly; only a bare basename, which
 * names no directory and cannot be resolved to one, falls back to matching on
 * basename.
 *
 * **That distinction is the whole fix, and matching on basename either way
 * fails.** `docs/index.md` and `docs/cat-harness/index.md` share the basename
 * `index.md`, so a basename-tolerant rule re-admits the exact collision above
 * — measured: it did, and the sweep still wrote five false `fail` sidecars
 * until the shape test replaced it.
 *
 * **That PARTICULAR pair no longer exists, and the rule is not weakened by
 * it.** `docs/cat-harness/index.md` moved on 2026-09-21 (bean `8h42`): the
 * authored page went to `docs/platform.md` and the generated page that took
 * its route is `published-graphs.md`, carrying `permalink: /cat-harness/`, so
 * there is one `index` stem in the site again. A reader checking the example
 * will not find the file — which is why this says so, rather than leaving a
 * defence that looks like it guards against nothing. Any two same-stem pages
 * reproduce it, and the next pair will not be announced.
 *
 * ## A PO with NO references is accepted, deliberately
 *
 * A hand-authored `glossary.po` carries no `#:` lines at all — `translation.ts`
 * documents it as having no POT because nobody extracted it. Rejecting those
 * would drop every shared glossary from every verdict. Absent references mean
 * "this PO does not say", which is not the same as "this PO says no", and only
 * the second is a reason to skip.
 */
export function poCovers(poText: string, subjectRel: string): boolean {
  const base = basename(subjectRel);
  let sawAny = false;
  for (const entry of parsePoEntries(poText)) {
    for (const ref of entry.references ?? []) {
      sawAny = true;
      const path = ref.replace(/:\d+$/, "").trim();
      const bare = !path.includes("/");
      if (bare ? path === base : path === subjectRel) return true;
    }
  }
  return !sawAny;
}

/** Build the report for one (block, locale), or `undefined` if untranslated. */
export function buildReport(
  blockMd: string,
  label: string,
  locale: string,
  poPaths: string[],
): TranslationBlockQaReport | undefined {
  if (poPaths.length === 0) return undefined;
  const rel = relative(INSTANCE_ROOT, blockMd);
  const merged = new Map<string, string>();
  for (const p of poPaths) {
    const text = readFileSync(p, "utf-8");
    if (!poCovers(text, rel)) continue;
    // Later sources override earlier ones for the same msgid — the order
    // `resolvePoSources` returns them in, which is the pipeline's rule.
    for (const [k, v] of parsePo(text)) merged.set(k, v);
  }
  // Every resolved PO disclaimed this subject: the stem matched and the content
  // does not belong to it. Absence, exactly as if no PO had resolved at all.
  if (merged.size === 0) return undefined;
  const md = readFileSync(blockMd, "utf-8");
  const m = measureBlock(md, rel, merged, readGlossary(INSTANCE_ROOT, locale));
  // Nothing of this block is in the PO: it is untranslated, which is an absence
  // and not a failing translation. See the header.
  if (m.translated === 0) return undefined;

  const stem = basename(blockMd).replace(/\.md$/, "");
  const tsPath = blockMd.replace(/\.md$/, ".ts");
  const poRel = relative(INSTANCE_ROOT, poPaths[poPaths.length - 1]!);
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

  // Three tiers of confidence, and the verdict is the worst that applies.
  //
  //  · `fail` — something the check CANNOT be wrong about: a URL or a number
  //    gone, or a term whose glossary-pinned form is absent too.
  //  · `warn` — an acronym no glossary speaks for. The check still cannot tell
  //    `WHO` → `OMS` from `WHO` dropped, so it says so rather than guessing.
  //  · `pass` — nothing missing, or everything missing is accounted for by the
  //    glossary. `resolvedAcronyms` is still reported, because a rule nobody
  //    can see working is a rule nobody can tell is wrong.
  const hardMissing = [...m.missingStrict, ...m.brokenGlossaryTerms];
  const missingAll = [...hardMissing, ...m.missingAcronyms];
  const notes: string[] = [];
  if (m.missingAcronyms.length > 0) {
    notes.push(
      `${m.missingAcronyms.length} acronym(s) from the source do not appear verbatim in the ` +
        `translation and no glossary entry speaks for them. That is right for one the target ` +
        `language localises — WHO is OMS in French — and wrong for one silently dropped, and ` +
        `this check cannot tell the two apart. Add them to translations/${locale}/glossary.po: ` +
        `a pinned msgstr says what the term must become, and a "#, localised" flag says it is ` +
        `rendered in the target language without pinning how.`,
    );
  }
  if (m.resolvedAcronyms.length > 0) {
    notes.push(
      `${m.resolvedAcronyms.length} further acronym(s) are absent verbatim and the glossary ` +
        `accounts for each: ${m.resolvedAcronyms.join("; ")}.`,
    );
  }
  criteria["translation-terms-preserved"] = [
    entry(
      hardMissing.length > 0 ? "fail" : m.missingAcronyms.length > 0 ? "warn" : "pass",
      fieldHash,
      {
        severity:
          hardMissing.length > 0 ? "major" : m.missingAcronyms.length > 0 ? "minor" : undefined,
        // The structured evidence shape, which `qa-witness` flattens for the
        // panel — `evidence` is `string | {line?, text?}[]`, never `string[]`.
        evidence: missingAll.length > 0 ? missingAll.map((t) => ({ text: t })) : undefined,
        metrics: {
          checked: m.translated,
          missing: missingAll.length,
          missing_strict: m.missingStrict.length,
          missing_acronyms: m.missingAcronyms.length,
          glossary_broken: m.brokenGlossaryTerms.length,
          glossary_resolved: m.resolvedAcronyms.length,
        },
        notes: notes.length > 0 ? notes.join(" ") : undefined,
      },
    ),
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
    paths: { md: rel, ts: existsSync(tsPath) ? relative(INSTANCE_ROOT, tsPath) : undefined },
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

/**
 * Every docs PAGE that is a translation subject in its own right.
 *
 * ## Why pages at all, when blocks are already swept
 *
 * A `WebPage` assembled from block triples has its translation measured per
 * block, and the page-level icon rolls those up. A HAND-AUTHORED page has no
 * blocks, so nothing measured it — and those are precisely the pages this site
 * actually has translations of. `docs/index.md` is translated into all five
 * target locales and carried no translation verdict anywhere. Bean `pp93`.
 *
 * ## Three exclusions, and each would be a wrong answer rather than a gap
 *
 * 1. **A GENERATED page.** `docs/crdm-methodology.md` is assembled from blocks
 *    that carry their own translation verdicts, so sweeping the assembled page
 *    as well would measure the same prose twice and roll it up twice — a page
 *    reporting eight criteria where four were established. Detected by the
 *    marker `gen-docs-pages.ts` writes into its own output, which is what bean
 *    `06e3` §4(b) added it for: before that marker a generated page was
 *    byte-indistinguishable from an authored one and this question had no
 *    answer.
 * 2. **A TRANSLATED page.** `docs/fr/index.md` is the OUTPUT of the translation
 *    whose quality is in question. Extracting its French prose and looking it
 *    up in a source→target PO finds nothing, so it would be reported as "not
 *    translated" — of the page that IS the translation. It is recognised by its
 *    own `lang`, never by its path: a folio with a `no/` chapter (Norwegian, or
 *    the English word) is the failure `translation-index.ts` documents at
 *    length, and this module is not going to reintroduce it one directory over.
 * 3. **Jekyll's own machinery** — `_data`, `_includes`, `_site`, `assets`,
 *    `vendor`. A leading underscore is Jekyll's convention, not a guess about
 *    language.
 */
function docsPages(siteDir: string, sourceLocale: string): { md: string; title: string }[] {
  const out: { md: string; title: string }[] = [];
  const walk = (abs: string): void => {
    for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = join(abs, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith("_") || e.name.startsWith(".")) continue;
        if (e.name === "assets" || e.name === "vendor") continue;
        walk(p);
        continue;
      }
      if (!e.isFile() || !e.name.endsWith(".md") || e.name.startsWith("_")) continue;
      const text = readFileSync(p, "utf-8");
      if (text.includes(GENERATED_MARKER)) continue;
      const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
      const lang = /^lang:\s*(\S+)/m.exec(fm)?.[1];
      if (lang !== undefined && lang !== sourceLocale) continue;
      const title = /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim().replace(/^["']|["']$/g, "");
      out.push({ md: p, title: title || basename(p).replace(/\.md$/, "") });
    }
  };
  walk(siteDir);
  return out;
}

/** The phrase every generator here writes into its own output. See `06e3`. */
const GENERATED_MARKER = "Generated by scripts/gen-docs-pages.ts";

/** One (subject, locale) pair swept: write, check, or report an orphan. */
interface SweepTally {
  written: number;
  stale: number;
  skipped: number;
}

/**
 * Sweep one subject across every locale.
 *
 * Shared by the block pass and the page pass because they differ in exactly two
 * things — how the subject is found and what it is called — and in nothing
 * about how a verdict is established, merged or written. A second copy of this
 * loop is a second place for the merge rule to drift.
 */
function sweepSubject(
  md: string,
  label: string,
  locales: string[],
  check: boolean,
  tally: SweepTally,
): void {
  const stem = basename(md).replace(/\.md$/, "");
  const chapterSlug = basename(join(md, ".."));
  const subjectRoot = md.replace(/\.md$/, "");
  for (const locale of locales) {
    const sources = resolvePoSources({
      folioRoot: INSTANCE_ROOT,
      locale,
      blockStem: stem,
      chapterSlug,
    }).map((s) => s.path);
    const doc = buildReport(md, label, locale, sources);
    // READ wherever it is, WRITE only to the results tree — `qa-paths.ts`.
    const existing = existingTranslationQaPath(INSTANCE_ROOT, subjectRoot, locale);
    const out = translationQaPath(INSTANCE_ROOT, subjectRoot, locale);
    if (!doc) {
      // An existing sidecar whose translation has gone is REPORTED, never
      // silently deleted: a verdict about a PO nobody can find any more is a
      // thing a person should look at, not something a sweep decides.
      if (existing) {
        console.error(`  ! ${relative(INSTANCE_ROOT, existing)} has no PO source any more`);
        tally.stale++;
      }
      tally.skipped++;
      continue;
    }
    const current = existing
      ? (JSON.parse(readFileSync(existing, "utf-8")) as TranslationBlockQaReport)
      : undefined;
    doc.criteria = mergeCriteria(current?.criteria, doc.criteria);
    const body = JSON.stringify(doc, null, 2) + "\n";
    // A verdict identical in substance but sitting at the LEGACY path is not
    // up to date: it still has to be written to the results tree, or every run
    // would report the corpus migrated while nothing moved.
    if (current && existing === out && substantive(current) === substantive(doc)) continue;
    if (check) {
      console.error(`  ✗ ${relative(INSTANCE_ROOT, out)} is stale`);
      tally.stale++;
      continue;
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, body);
    tally.written++;
    const cov = doc.criteria["translation-coverage"]?.[0]?.metrics;
    console.log(`  ✓ ${relative(INSTANCE_ROOT, out)} (${cov?.translated}/${cov?.total} strings)`);
  }
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const root = join(INSTANCE_ROOT, arg("root", join("content", "docs")));
  const src = sourceLocale(INSTANCE_ROOT);
  const locales = arg("locales", targetLocales(INSTANCE_ROOT).join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const tally: SweepTally = { written: 0, stale: 0, skipped: 0 };

  for (const block of walkBlocks(root, { includeUnlabelled: true, verify: false })) {
    if (!block.md || !existsSync(block.md)) continue;
    const stem = basename(block.md).replace(/\.md$/, "");
    sweepSubject(block.md, block.label ?? stem, locales, check, tally);
  }

  // The docs site, unless the caller pointed `--root` somewhere else.
  if (!process.argv.includes("--root")) {
    const siteDir = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT));
    if (existsSync(siteDir)) {
      for (const page of docsPages(siteDir, src)) {
        sweepSubject(page.md, page.title, locales, check, tally);
      }
    }
  }

  const { written, stale, skipped } = tally;

  if (check && stale > 0) {
    console.error(
      `\n${stale} sidecar(s) stale — run: ${RERUN_COMMAND}`,
    );
    process.exit(1);
  }
  console.log(
    check
      ? "\ntranslation sidecars are up to date"
      : `\nWrote ${written} sidecar(s); ${skipped} (block, locale) pair(s) have no translation`,
  );
}
