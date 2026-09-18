/**
 * Per-content-block QA report schema.
 *
 * Each content block (a `.ts` + `.md` + optional `.lean` triple under
 * `content/`) may have a sibling `<block>.qa.json` audit-report file.
 * The report records, per QA criterion, the result of an audit pass
 * along with the source-file hashes at audit time so staleness can
 * be detected when a sibling file is later edited.
 *
 * Multiple reviewer entries per criterion are allowed (script +
 * agent + human adjudication). The first entry whose `field_hash`
 * still matches the current source files is the "fresh" entry for
 * that criterion.
 *
 * Authoritative reference for the architecture: the integration-
 * watcher skill family — see
 * `.claude/skills/local/one-voice-integration-watcher.md`.
 *
 * @module schemas/block-qa
 */

import { CONTENT_PROFILES } from "./block-kinds";

import type { ContentAdapter, ContentProfile } from "./block-kinds";

/**
 * The kind of reviewer that produced this finding.
 *
 * - `script`: a deterministic CLI (e.g. `qa-sweep.ts`) ran a grep /
 *   AST check. Reproducible. `id` is the script name + version.
 * - `agent`: an LLM-driven sub-agent (Claude, Copilot, Gemini) read
 *   the block and adjudicated. Not deterministic. `id` names the
 *   model + skill that called it.
 * - `human`: the repo owner (or a human collaborator) adjudicated.
 *   Final authority. `id` is the GitHub login.
 */
export const QA_REVIEWER_KINDS = ["script", "agent", "human"] as const;
export type QaReviewerKind = (typeof QA_REVIEWER_KINDS)[number];

/**
 * Identity + provenance of a single QA reviewer entry.
 */
export interface QaReviewer {
  kind: QaReviewerKind;
  /** Stable identifier — script path, agent name, GitHub login. */
  id: string;
  /** Optional version pin (script revision, model id). */
  version?: string;
  /**
   * 12-char SHA-256 prefix of the script's source-file content at
   * the time this entry was written. Populated for `kind: "script"`.
   * On freshness check, current file hash is compared against this;
   * mismatch ⇒ entry is stale (the checker logic has changed).
   *
   * Mirrors the `scriptHash` convention used by
   * `folio-assistant/computations/witness_base.py`.
   */
  script_hash?: string;
  /**
   * Full git SHA at which the script was most recently committed at
   * audit time (`git log -n 1 --format=%H -- <source_file>`). Used
   * for audit trail and provenance — NOT used to drive staleness
   * (use `script_hash` for that; an uncommitted edit can change the
   * hash without changing the commit SHA).
   */
  script_commit_sha?: string;
  /**
   * 12-char SHA-256 prefix of the concatenated content of every
   * extra input the checker consults beyond the block under audit
   * (see `QaCriterionDefinition.extra_inputs`). Mismatch ⇒ stale.
   */
  deps_hash?: string;
  /**
   * 12-char SHA-256 prefix over the criterion DEFINITION's run-affecting
   * fields — `profiles`, `adapters`, `applies_to`, `depends_on`,
   * `default_severity`, `lean_granularity`. Mismatch ⇒ stale.
   *
   * `script_hash` covers the checker's CODE and `deps_hash` its extra INPUTS;
   * neither covers the criterion itself, so re-scoping one left every cached
   * verdict in place. Measured 2026-09-19: adding `profiles: ["paper"]` to
   * `voice-scholarly-default` and re-sweeping a `document` corpus changed
   * nothing — `qa-sweep --only` reported `fresh-skip` for every block, short-
   * circuiting before the profile gate. Same failure the registry documents
   * for Lean docstrings on that criterion (qou #4673): a verdict that can
   * fail to CLEAR is worse than one that can fail to appear.
   *
   * Deliberately NOT over `description`: for a script criterion the prose is
   * documentation, and hashing it would invalidate a whole corpus on a typo
   * fix. An agent-adjudicated criterion's description IS its meaning, but
   * agent entries are never invalidated by this field — only `kind: "script"`
   * entries are compared.
   */
  def_hash?: string;

  // ── Agent-specific provenance (populated when kind === "agent") ──

  /** LLM model identifier, e.g. "claude-opus-4-7", "gemini-2.5-pro". */
  agent_model?: string;
  /** Claude Code session ID or equivalent for the reviewing agent. */
  agent_session?: string;
  /** ISO date of the agent review. */
  agent_date?: string;
  /** Skill that dispatched the review, e.g. "local/one-voice-audit", "local/devils-advocate-watcher". */
  agent_skill?: string;
}

/**
 * Companion file roles a QA criterion can depend on.
 *
 * A content block is a file stem plus its siblings, and the sidecar
 * `<stem>.qa.json` is what makes it a *content block* rather than a file —
 * QA is the unit boundary. Which siblings exist depends on what kind of
 * content the folio holds:
 *
 * | Role | Content type | Carries |
 * |---|---|---|
 * | `md` | any | prose |
 * | `ts` | any | the block manifest |
 * | `lean` | paper | the formalisation |
 * | `bpmn` | WHO L2 DAK | a business process (BPMN 2.0) |
 * | `dmn` | WHO L2 DAK | decision-support logic (a DMN table) |
 * | `xlsx` | WHO L2 DAK | a data dictionary / indicator sheet |
 * | `fsh` | WHO L3 | a FHIR profile, ValueSet, PlanDefinition… |
 * | `cql` | WHO L3 | Clinical Quality Language logic |
 * | `feature` | WHO L2 | Gherkin feature file — `TestScenario.fsh` makes it `feature 1..1 uri` |
 *
 * Compiled FHIR JSON is deliberately **not** a role. SUSHI generates it from
 * the `.fsh`, so it is a build output rather than an authored companion — a
 * criterion that cares about the resource depends on the source that produced
 * it. (A `json` role would also shadow `BaseModel.json` in the Python mirror
 * of this schema, which warns at class-definition time.)
 *
 * ## Why this had to stop being `"md" | "ts" | "lean"`
 *
 * That triple is the *paper* adapter's companion set, and it was the type of
 * `depends_on` — which gates **applicability**, not just freshness. So a
 * criterion could not say "applies to blocks with a `.dmn`", and worse, every
 * L2/L3 block would take the `n/a-no-md` path and record a clean `n/a` for
 * every axis. QA would report a swept, healthy corpus it had never checked —
 * exactly the false pass the integration contract in
 * `docs/proposals/rag-document-ingestion.md` §5 exists to prevent, and
 * indistinguishable downstream from "a block with nothing wrong".
 *
 * Adding a role here does not make any existing criterion apply to it: a
 * criterion opts in by listing the role in its own `depends_on`.
 */
export const COMPANION_ROLES = [
  "md",
  "ts",
  "lean",
  "bpmn",
  "dmn",
  "xlsx",
  "fsh",
  "cql",
  "feature",
] as const;

export type CompanionRole = (typeof COMPANION_ROLES)[number];

/**
 * The companion paths handed to an automated checker.
 *
 * Every present companion, keyed by role — not the paper triple. A DAK
 * checker reads `paths.dmn` or `paths.fsh` the same way a voice checker reads
 * `paths.md`, and `qa-sweep` populates all of them from the block's resolved
 * siblings.
 */
export type CheckerPaths = Partial<Record<CompanionRole, string>>;

/**
 * One place a checker found what it was looking for.
 *
 * Moved here from `content/pipeline/qa-checkers-extended.ts` on 2026-09-18, to
 * sit beside {@link CheckerPaths} — a checker's input and its output belong
 * together, and `CheckerPaths` was already here. The move is what lets
 * `schemas/contributions.ts` type a CONTRIBUTED checker: a dependency that
 * adds QA criteria has to describe them in a shape the registry can hold, and
 * the registry cannot import the pipeline.
 */
export interface CheckerHit {
  file: string;
  line: number;
  text: string;
}


/**
 * Which companion roles each adapter's blocks can actually have.
 *
 * `md` and `ts` are shared: every block has a manifest, and either kind of
 * block may carry prose. `lean` is paper-only; the BPMN/DMN/FSH/CQL/XLSX
 * artefacts are DAK-only.
 *
 * Stated here so that "a paper criterion depends on `.dmn`" is a *checkable*
 * mistake rather than one that shows up as a criterion which silently never
 * applies — `depends_on` gates applicability, so a mismatched pair produces a
 * permanent `n/a` and no error.
 */
export const ADAPTER_COMPANION_ROLES: Record<ContentAdapter, readonly CompanionRole[]> = {
  paper: ["md", "ts", "lean"],
  dak: ["md", "ts", "bpmn", "dmn", "xlsx", "fsh", "cql", "feature"],
};

/**
 * Companion roles a criterion declares that no adapter in its scope can
 * provide — always empty in a healthy registry.
 */
export function incompatibleCompanions(def: {
  adapters?: ContentAdapter[];
  depends_on: CompanionRole[];
}): CompanionRole[] {
  const allowed = new Set<CompanionRole>();
  for (const a of criterionAdapters(def)) {
    for (const r of ADAPTER_COMPANION_ROLES[a]) allowed.add(r);
  }
  return def.depends_on.filter((r) => !allowed.has(r));
}

/** The adapters a criterion applies to, with the documented default applied. */
export function criterionAdapters(def: {
  adapters?: ContentAdapter[];
}): readonly ContentAdapter[] {
  return def.adapters ?? ["paper"];
}

/**
 * The profiles a criterion applies to, with the documented default applied.
 *
 * Note the default runs the OTHER WAY from {@link criterionAdapters}: absent
 * means **every** profile, not one of them. See `QaCriterionDefinition.profiles`
 * for why the two axes default in opposite directions.
 */
export function criterionProfiles(def: {
  profiles?: ContentProfile[];
}): readonly ContentProfile[] {
  return def.profiles ?? CONTENT_PROFILES;
}

/**
 * Should the profile axis exclude this criterion from a folio declaring
 * `folioProfile`?
 *
 * `folioProfile` is `undefined` for a folio that does not say — no
 * `harness.config.json`, no `contentType` in it, or a config that will not
 * parse. That third state returns **`false`**: the criterion runs.
 *
 * That is the whole reason this is a named function rather than an inline
 * `!includes(...)` at the one call site. "Could not determine" is not
 * "document", and a folio whose configuration a tool cannot read must not
 * quietly lose QA coverage on the strength of a guess — the resulting clean
 * sweep is indistinguishable from a real one. `profileForContentType`
 * resolves the unknown case to `paper` because a *validator* asking "may this
 * folio contain this block?" is safest with the wider vocabulary; a *gate*
 * asking "may I skip this check?" is safest running it.
 */
export function profileExcludesCriterion(
  def: { profiles?: ContentProfile[] },
  folioProfile: ContentProfile | undefined,
): boolean {
  if (!folioProfile) return false;
  return !criterionProfiles(def).includes(folioProfile);
}

/**
 * Roles whose *content* is a text file a checker can read directly.
 *
 * `xlsx` is deliberately absent: it is a ZIP container, so hashing its bytes
 * is meaningful but grepping them is not. A criterion over a data dictionary
 * has to go through an extractor rather than reading the sibling.
 */
export const TEXTUAL_COMPANION_ROLES: readonly CompanionRole[] = [
  "md",
  "ts",
  "lean",
  "bpmn",
  "dmn",
  "fsh",
  "cql",
  "feature",
];

/**
 * Hash of the source files at the moment a criterion was audited.
 *
 * Each entry is a 12-char prefix of the SHA-256 of the file's
 * UTF-8 bytes — same convention as
 * `folio-assistant/computations/witness_staleness_tracker.py`.
 *
 * Absent fields mean the criterion's audit did not depend on that
 * file (or the file did not exist at audit time).
 *
 * Keyed by {@link CompanionRole}, plus two derived keys (`graph`,
 * `lean_statement`) that are not companion files at all.
 */
export interface QaFieldHash extends Partial<Record<CompanionRole, string>> {
  /**
   * Hash of the chapter's `uses[]` edge set, for criteria whose verdict is a
   * property of the GRAPH rather than of this block's own files.
   *
   * The detangler axis is the case: forward references, dependency cycles,
   * cone depth and graph energy are all computed across the whole chapter, so
   * editing block A's `uses[]` changes block B's verdict while B's own `.md` /
   * `.ts` / `.lean` are untouched. Keyed only on its own files, B stays
   * `fresh-skip` and keeps a verdict that is now wrong — observed live in qou,
   * where breaking three dependency cycles left 15 blocks still recording
   * `detangler-no-dependency-cycle: fail` for cycles that no longer existed.
   *
   * Present only on entries for graph-scoped criteria (those declaring
   * `also_invalidated_by: ["graph"]`), so ordinary criteria neither carry nor
   * compare it.
   */
  graph?: string;
  /**
   * Hash of only the **declaration signatures** in the `.lean` file —
   * everything up to each declaration's `:=` / `where`.
   *
   * Some criteria care only about what a block *claims*, not how it is
   * justified. `proof-narrative-lean-equiv` compares the narrative
   * statement to the Lean signature; `proof-statement-integrity` guards
   * against the signature changing. Rewriting a proof body cannot
   * affect either verdict, yet under the whole-file `lean` hash it
   * invalidated both — so every proof edit re-queued agent
   * adjudications that could not have changed.
   *
   * Criteria opt in via `QaCriterionDefinition.lean_granularity`.
   * Absent, a criterion keeps using the whole-file `lean` hash.
   *
   * Derived lexically (see `content/pipeline/lean-signature.ts`), so it
   * is approximate. It is computed to fail SAFE: if the file cannot be
   * lexed into declarations, this is left `undefined` and freshness
   * falls back to the whole-file hash — over-invalidating, never under.
   */
  lean_statement?: string;
}

/**
 * The outcome of one reviewer evaluating one criterion on one block.
 *
 * `result: "pass"` — criterion satisfied. `evidence` may be empty.
 * `result: "fail"` — criterion violated. `evidence` must cite
 *   file:line + a verbatim quote of the offending text.
 * `result: "warn"` — borderline; reviewer flags but does not block.
 * `result: "n/a"` — criterion does not apply to this block kind.
 */
export interface QaCriterionEntry {
  /** Source-file hashes captured at audit time. */
  field_hash: QaFieldHash;
  /** Outcome. */
  result: "pass" | "fail" | "warn" | "n/a";
  /** Severity if `result` is `"fail"` or `"warn"`. */
  severity?: "critical" | "major" | "minor";
  /**
   * Optional rubric score for rater-style (quality) criteria
   * (`proof-rater-*`). `value` ∈ [0, max]; `rubric` holds per-dimension
   * sub-scores. A score is a *quality* measure to improve over time, not
   * a pass/fail gate. Convention: value/max ≥ 0.66 ⇒ result "pass",
   * 0.33–0.66 ⇒ "warn", < 0.33 ⇒ "fail" (severity "minor"). Populated by
   * `kind: "agent"` reviewers; absent for binary criteria.
   */
  score?: { value: number; max: number; rubric?: Record<string, number> };
  /**
   * Evidence for fail/warn verdicts: either a free-form "file:line +
   * verbatim quote" string, or a structured list of { line, text }
   * locations. Some agent reviewers (voice axis especially) emit the
   * structured shape; the live corpus carries both.
   */
  evidence?: string | Array<{ line?: number; text?: string }>;
  /**
   * Optional structured numeric/heuristic measures a checker emits
   * alongside its verdict — e.g. the detangler axis records per-block
   * graph metrics (`fwd_emitted`, `out_degree`, `in_degree`,
   * `cone_size`, `edge_span_max`, `graph_energy`, `topic_*`). Unlike
   * `score` (a quality rubric to improve over time) these are
   * descriptive structural measures of the block's position in the
   * dependency graph. Keys are checker-defined; values are scalars or
   * short strings (e.g. a worst-offending target label). Persisted so
   * the sidecar carries the heuristic snapshot, not just pass/fail.
   */
  metrics?: Record<string, number | string>;

  // ── da-axis extension fields ──
  /** Refutation scope (AGENTS.md "Before declaring refuted"). */
  scope?: "limited" | "structural";
  /** Adjudicator ruling on a single objection. */
  ruling?: "surviving" | "rebutted" | "partial";
  /** The objection in the referee's voice (1-3 sentences). On a
   *  da-referee-verdict rollup entry, the strongest objection. */
  referee_argument?: string;
  /** What rebuts the objection, or "none — survived because …".
   *  For scope:"structural" this must name the proved invariant. */
  rebuttal?: string;
  /** Block-level rollup verdict. Set ONLY on da-referee-verdict entries. */
  verdict?: "clean" | "survivable-objection" | "open-objection";

  /** Reviewer identity + provenance. */
  reviewer: QaReviewer;
  /** When the audit ran (ISO-8601 UTC). */
  reviewed_at: string;
  /**
   * Repo HEAD at audit time (full git SHA). Producers must set this on
   * every new entry; optional in the type only because legacy agent
   * entries (pre-2026-06) omit it — matching the interchange schema
   * (`tools/block-qa-schema/`), where it is likewise optional.
   */
  reviewed_sha?: string;
  /** Free-form notes. */
  notes?: string;
}

/**
 * The full per-block QA report file shape.
 *
 * Filename: `<block-root>.qa.json` (sibling of `<block-root>.md`).
 *
 * `criteria` maps each named criterion to an **array** of reviewer
 * entries. Multiple entries are allowed; the criterion's "current
 * verdict" is the most recent entry whose `field_hash` matches the
 * present source files. If no entry matches, the criterion is
 * stale and requires re-audit.
 */
export interface BlockQaReport {
  /** Schema marker — value: `block-qa/v1`. */
  $schema: "block-qa/v1";
  /** Block label (e.g. `def:carbon-valence`, `rem:carbon-valence`). */
  label: string;
  /** Block kind (mirror of the .ts manifest's discriminator). */
  kind: string;
  /** Paths to source files, relative to repo root. */
  paths: {
    ts: string;
    md?: string;
    lean?: string;
  };
  /** Hashes of present source files (refreshed on every write). */
  source_hashes: QaFieldHash;
  /**
   * Per-criterion reviewer entries. Multiple reviewers (script +
   * agent + human) may co-exist; they are NOT deduplicated.
   */
  criteria: Record<string, QaCriterionEntry[]>;
  /** Report creation / last-update timestamp (ISO-8601 UTC). */
  updated_at: string;
}

/**
 * Definition of a single QA criterion — registered ahead of time
 * by the watcher's criterion catalog.
 */
/**
 * What a criterion audits. See {@link QaCriterionDefinition.subject}.
 */
export type QaCriterionSubject = "block" | "script";

export interface QaCriterionDefinition {
  /** Stable identifier (e.g. `voice-status-leak`). */
  id: string;
  /** Domain bucket — `voice`, `fit`, `framework`, `wall`, etc. */
  domain: string;
  /** Human-readable one-liner. */
  description: string;
  /** Default severity when the criterion fails. */
  default_severity: "critical" | "major" | "minor";
  /**
   * Which source files this criterion depends on.
   *
   * This field carries TWO meanings, and they are not the same thing:
   *
   * 1. **Applicability.** A block missing a listed file gets an `n/a`
   *    verdict and the checker never runs (`qa-sweep`'s `n/a-no-md` /
   *    `n/a-no-lean` paths).
   * 2. **Freshness.** A cached verdict is stale once a listed file's
   *    hash moves away from the entry's `field_hash`.
   *
   * When a criterion *reads* a file but must still apply to blocks that
   * lack it, listing the file here is wrong — it would `n/a` exactly the
   * blocks the criterion exists to check. Use `also_invalidated_by`
   * instead, which buys freshness without the applicability gate.
   */
  /**
   * Which content adapters this criterion applies to.
   *
   * **Absent means `["paper"]`**, not "all". Every criterion in the registry
   * today was written for the paper adapter — its axes are about scholarly
   * voice, proof structure, Lean formalisation and reading order — so an
   * absent field must not silently widen them over WHO L2/L3 blocks. A
   * `voice-scholarly-default` verdict on a FHIR ValueSet is not a finding,
   * it is a category error, and one that would arrive as a `fail` rather
   * than as an obviously wrong `n/a`.
   *
   * Defaulting to `all` was the alternative, and it is the trap: it needs
   * every one of the ~47 existing criteria edited to stay correct, and any
   * that were missed would misfire silently. Defaulting to the adapter they
   * were all written for needs none, and a new DAK criterion opts in by
   * saying so.
   *
   * Resolve with `criterionAdapters()` rather than reading this directly.
   */
  adapters?: ContentAdapter[];
  /**
   * Which content **profiles** this criterion applies to.
   *
   * **Absent means every profile**, not one of them — the exact opposite of
   * `adapters` directly above, and deliberately so. The two fields look alike
   * and read alike, so the reason they default in opposite directions is
   * worth stating rather than inferring:
   *
   * | | `adapters` | `profiles` |
   * |---|---|---|
   * | members are | disjoint namespaces | nested restrictions |
   * | absent means | `["paper"]` — narrow | all of them — wide |
   * | a wrong default produces | a criterion that never runs | a criterion that misfires |
   *
   * Adapters partition. A criterion written for the paper vocabulary has
   * *nothing* to say about a FHIR ValueSet, so widening by default would have
   * pointed ~47 existing criteria at a corpus none of them was written for.
   *
   * Profiles nest: every `document` kind is also a `paper` kind, and every
   * criterion in the registry predating this field was written against
   * `prose`, `remark`, `example` and the rest — which is to say, against the
   * document vocabulary — with the paper-only kinds as an *addition*.
   * Narrowing by default would therefore stop those criteria running on
   * document folios and report the result as a clean sweep. That is a **false
   * pass**, and a false pass is strictly worse than a false fail here: a
   * wrong `fail` is read by a reviewer and argued with, while a wrong `pass`
   * is read by nobody and silently becomes the folio's QA record.
   *
   * So the field is an **opt-out for the genuinely paper-only**, declared one
   * criterion at a time with its reason written beside it: a criterion whose
   * verdict rests on a TeX toolchain the document render path does not have
   * (`document_render_*` goes through pandoc and never falls back to
   * `latexmk`), or on Lean formalization that {@link DOCUMENT_FORBIDS_LEAN}
   * bars a document folio from carrying at all.
   *
   * Two things this field is **not** for, because both are easy to mistake
   * for it:
   *
   * - **Folio-specific axes.** A criterion that assumes one folio's subject
   *   matter — CODATA calibration anchors, a q-deformation regime, a named
   *   chapter directory — is not paper-only, it is *that folio*-only, and a
   *   paper folio about anything else is equally miscategorised by it. That
   *   is what `folioOptionalAxes()` in the registry exists for.
   * - **Kind scoping.** A criterion that only makes sense on a `theorem`
   *   already says so in `applies_to`, and a document folio cannot hold one.
   *   Restating it here adds a second answer to the same question.
   *
   * Resolve with `criterionProfiles()` rather than reading this directly.
   */
  profiles?: ContentProfile[];
  depends_on: CompanionRole[];
  /**
   * Extra files that invalidate a cached verdict WITHOUT gating
   * applicability — the freshness half of `depends_on` on its own.
   *
   * Exists because the two meanings above genuinely come apart.
   * `voice-scholarly-default` is the motivating case: it scans Lean
   * docstrings as well as `.md`, but must keep running on prose-only
   * blocks that have no `.lean` sibling at all. Listing `"lean"` in
   * `depends_on` would `n/a` every such block; omitting it entirely
   * meant a Lean-only edit could neither raise a finding nor CLEAR one,
   * so a fixed docstring kept serving a stale `fail` until the sidecar
   * entry was deleted by hand.
   *
   * Consulted by `entryIsFresh` via `freshnessKeys()`; ignored by the
   * applicability gates.
   */
  also_invalidated_by?: Array<CompanionRole | "graph">;
  /**
   * Whether a deterministic script can run this criterion (true) or
   * it requires agent / human adjudication (false).
   */
  automated: boolean;
  /**
   * What the criterion is evaluated **against** — and therefore what shape
   * its checker takes.
   *
   * - omitted / `"block"` — a content block. The checker takes
   *   {@link CheckerPaths}. This is every criterion on the block sweep.
   * - `"script"` — a source script. The checker takes its path as a string,
   *   and the criterion belongs to `script-sweep`, not `qa-sweep`.
   *
   * **This exists so discovery does not have to guess from the domain name.**
   * The two subjects were told apart by `domain === "script-quality"`, which
   * is a bucket label rather than a contract: a second script axis under any
   * other name would have been handed to the block sweep, where its checker
   * would receive a `CheckerPaths` object as its `scriptPath` and read
   * `[object Object]` off disk. `content/pipeline/qa-checker-discovery.ts`
   * partitions on this field, so the mismatch is impossible rather than
   * merely unlikely.
   *
   * Absent means `"block"` because every criterion predating the field was
   * one, and a wrong default here is a checker invoked with the wrong
   * argument type — which fails loudly, unlike the silent misfires the
   * `adapters` / `profiles` defaults above are guarding.
   */
  subject?: QaCriterionSubject;
  /**
   * How finely this criterion depends on its `.lean` file.
   *
   * - omitted / `"file"` — any byte change invalidates. The default,
   *   and correct for anything that reads the proof.
   * - `"statement"` — only the declaration SIGNATURES matter, so a
   *   proof-body rewrite leaves the verdict fresh. Set this only when
   *   the criterion genuinely cannot be affected by a proof body;
   *   getting it wrong presents a stale verdict as current.
   *
   * Ignored unless `depends_on` includes `"lean"`.
   */
  lean_granularity?: "file" | "statement";
  /**
   * Optional gating: block kinds the criterion applies to.
   * Empty / undefined means "all kinds".
   */
  applies_to?: string[];
  /**
   * Path (repo-relative) to the source file containing this
   * criterion's checker function. Required for `automated: true`
   * criteria; ignored otherwise. Used to compute the entry's
   * `script_hash` so a checker-logic change auto-invalidates
   * downstream sidecar entries.
   *
   * If omitted, the registry's `getCriterionSourceFile()` helper
   * resolves a default based on the criterion id prefix.
   */
  source_file?: string;
  /**
   * Repo-relative paths to extra inputs the checker consults beyond
   * the block under audit — for example, cached audit witnesses
   * (`docs/audits/*.json`), the bibliography database
   * (`content/schema/references.ts`), or cross-block manifests.
   * Concatenated content of these files is hashed into `deps_hash`
   * on the entry. Changes invalidate the entry.
   */
  extra_inputs?: string[];
}

/**
 * Per-script audit sidecar — mirrors the Python-pipeline
 * `*.witness.json` convention from
 * `folio-assistant/computations/witness_base.py`.
 *
 * One sidecar per automated criterion, recording the canonical
 * `(script_hash, script_commit_sha, deps_hash)` triple captured at
 * the most recent qa-sweep run. Block-level `QaCriterionEntry`
 * records snapshot the same triple inline so per-entry freshness
 * is checkable without a sidecar lookup; this script-level sidecar
 * is the single-source-of-truth view "is checker X currently
 * stale globally?".
 *
 * Filename: `<criterion-id>.script.json` under
 * `content/pipeline/script-sidecars/`.
 */
export interface QaScriptSidecar {
  /** Schema marker — value: `qa-script/v1`. */
  $schema: "qa-script/v1";
  /** Criterion id this sidecar tracks (e.g. `proof-no-bare-sorries`). */
  criterion_id: string;
  /** Path (repo-relative) to the checker's source file. */
  source_file: string;
  /** 12-char SHA-256 prefix of the source file's content. */
  script_hash: string;
  /** Full git SHA of the most recent commit touching `source_file`. */
  script_commit_sha: string;
  /** Optional repo-relative paths to extra-input files. */
  extra_inputs?: string[];
  /** 12-char SHA-256 of concatenated extra_inputs (omitted if none). */
  deps_hash?: string;
  /** ISO-8601 UTC timestamp of the most recent qa-sweep run. */
  last_run_at: string;
  /** Repo HEAD at the most recent sweep (full git SHA). */
  last_run_sha: string;
  /** Engine fingerprint — e.g. `bun-1.3.11+node-22`. */
  engine_version?: string;
}

/**
 * What a checker concluded.
 */
export interface CheckerResult {
  /**
   * Outcome. `warn` is preserved end-to-end (matches block-qa/v1's
   * `QaCriterionEntry.result` union) so a soft finding lands in the
   * sidecar without being silently coerced to `pass`.
   */
  result: "pass" | "fail" | "warn" | "n/a";
  hits: CheckerHit[];
  /**
   * Optional human-readable context threaded into the sidecar entry's
   * `notes` field. Used by cache-backed checkers (e.g.
   * `proof-lean-compiles`) to record WHY a result is `n/a` — for
   * instance "cached diagnostics are stale relative to current .lean".
   */
  notes?: string;
  /**
   * Optional structured numeric/heuristic measures persisted into the
   * sidecar entry's `metrics` field (see `QaCriterionEntry.metrics`).
   * Used by the detangler axis to record per-block graph measures
   * (degree, dependency-cone size, edge span, graph energy, topic
   * coherence) alongside the pass/fail verdict.
   */
  metrics?: Record<string, number | string>;
}
