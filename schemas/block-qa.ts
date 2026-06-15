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
export type QaReviewerKind = "script" | "agent" | "human";

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

  // ── Agent-specific provenance (populated when kind === "agent") ──

  /** LLM model identifier, e.g. "claude-opus-4-7", "gemini-2.5-pro". */
  agent_model?: string;
  /** Claude Code session ID or equivalent for the reviewing agent. */
  agent_session?: string;
  /** ISO date of the agent review. */
  agent_date?: string;
  /** Skill that dispatched the review, e.g. "local/one-voice-audit". */
  agent_skill?: string;
}

/**
 * Hash of the source files at the moment a criterion was audited.
 *
 * Each entry is a 12-char prefix of the SHA-256 of the file's
 * UTF-8 bytes — same convention as
 * `folio-assistant/computations/witness_staleness_tracker.py`.
 *
 * Absent fields mean the criterion's audit did not depend on that
 * file (or the file did not exist at audit time).
 */
export interface QaFieldHash {
  md?: string;
  ts?: string;
  lean?: string;
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
   * Used to compute staleness: criterion is fresh iff every listed
   * file's current hash equals the reviewer entry's `field_hash`.
   */
  depends_on: Array<"md" | "ts" | "lean">;
  /**
   * Whether a deterministic script can run this criterion (true) or
   * it requires agent / human adjudication (false).
   */
  automated: boolean;
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
