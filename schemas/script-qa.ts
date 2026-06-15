/**
 * Per-script QA report schema.
 *
 * Where `folio-assistant/schemas/block-qa.ts` audits **content
 * blocks** (`.ts` + `.md` + optional `.lean` triples under
 * `content/`), this schema audits **scripts** — Python files under
 * `folio-assistant/computations/`, TypeScript files under
 * `content/pipeline/`, and (later) Rust files under any compiled
 * compute backend. Criteria like `does_not_default_to_float` and
 * `respects_archimedean_wall` apply to script source code; they
 * have no meaning for narrative `.md` content, so they live in
 * this dedicated subject-axis sidecar rather than being shoehorned
 * into block sidecars.
 *
 * Layout:
 *
 *   folio-assistant/computations/markov_peel.py
 *   folio-assistant/computations/script-qa/markov_peel.script-qa.json
 *
 * One sidecar per script, sitting in a `script-qa/` subdirectory of
 * the script's parent dir. Mirrors the per-block `<block>.qa.json`
 * convention but keeps script-QA bookkeeping clearly separated from
 * `*.witness.json` (compute outputs) and `*.script.json` (per-
 * criterion checker version pins from
 * `content/pipeline/script-sidecars/`).
 *
 * @module schemas/script-qa
 */

import type {
  QaCriterionEntry,
  QaCriterionDefinition,
} from "./block-qa";

/**
 * Source language of the audited script. Determines which checker
 * subset applies — `script-sweep` dispatches per language, returning
 * `n/a` for any (criterion, language) pair lacking a registered
 * checker.
 *
 * Currently only the `python` checker for `does_not_default_to_float`
 * is wired (see `SCRIPT_CHECKERS` in `content/pipeline/script-sweep.ts`).
 * Future criteria (`respects_archimedean_wall`, `variables_typed`, …)
 * will extend coverage to TypeScript and Rust as separate follow-up
 * PRs land each checker.
 */
export type ScriptLanguage = "python" | "typescript" | "rust";

/**
 * Per-script QA report. One file per script audited.
 *
 * Filename: `<script-basename-without-ext>.script-qa.json`,
 * placed in `<script-parent-dir>/script-qa/`.
 */
export interface ScriptQaReport {
  /** Schema marker — value: `script-qa/v1`. */
  $schema: "script-qa/v1";
  /** Repo-relative path to the audited script. */
  script_path: string;
  /** Source language inferred from extension. */
  language: ScriptLanguage;
  /** 12-char SHA-256 prefix of the script's content. */
  source_hash: string;
  /** ISO-8601 UTC timestamp of last write. */
  updated_at: string;
  /**
   * **Proper-metadata references** the script declares to
   * propositions, definitions, theorems, glossary entries, or
   * bibliographic keys. Mirrors the content-block convention of
   * `uses: [...]` / `meta.cites: [...]` arrays in `.ts` manifests.
   *
   * Each entry is one of:
   *   - content-block label: `"prop:foo-bar"`, `"def:carbon-valence"`,
   *     `"thm:lifting-exists"`, `"conj:foo"`, `"rem:foo"`, `"cor:foo"`,
   *     `"ex:foo"`, `"sim:foo"`, `"sec:foo"`, `"tbl:foo"`, `"fig:foo"`
   *   - bibliographic key matching an entry in
   *     `content/schema/references.ts` (e.g. `"wenzl1988"`,
   *     `"kashaev1997"`)
   *   - the literal sentinel `"manuscript"` — internal-manuscript
   *     reference (per CLAUDE.md §1 Lean-side convention) for
   *     citations whose target is the current paper itself rather
   *     than an external bibliography entry. Recognised as valid
   *     by the criterion; does NOT need a matching entry in
   *     `content/schema/references.ts`.
   *
   * This field is the **canonical metadata** that the
   * `has_references_to_paper` criterion checks. It is
   * **human-authored only** — the sweep does not auto-populate
   * this field from script source (per author direction
   * 2026-05-24: "no citation grepped from content; only proper
   * metadata"). Authors edit the sidecar directly to add,
   * remove, or override entries.
   *
   * Empty array means the script genuinely has no paper references
   * (e.g. pure infrastructure / utility code) — distinct from
   * `undefined`, which means the field has never been populated
   * and the script will fail the criterion.
   */
  references?: string[];
  /**
   * Per-criterion reviewer entries. Reuses the block-QA
   * `QaCriterionEntry` shape (script_hash / script_commit_sha /
   * deps_hash on the reviewer apply identically here).
   */
  criteria: Record<string, QaCriterionEntry[]>;
}

/**
 * Helper — narrows a `QaCriterionDefinition` to those whose domain
 * indicates the audit subject is a script file, not a content
 * block. Currently the convention is `domain: "script-quality"`.
 */
export function isScriptCriterion(def: QaCriterionDefinition): boolean {
  return def.domain === "script-quality";
}
