/**
 * Lean proof-refactoring strategy database.
 *
 * The distinctive contribution of Lean Refactor (arXiv 2605.20244) is
 * not a model — it is a **curated, version-annotated strategy store**
 * used to steer a *frozen* LLM. No fine-tuning, and the annotations are
 * what make a strategy safe to apply to a corpus that outlives Mathlib
 * releases.
 *
 * folio already had the seed of this: the mechanical anti-pattern table
 * in the `proof-simplifier` skill. That table is prose — it cannot be
 * queried, version-gated, or measured. This schema turns it into data.
 *
 * ## Why version metadata is load-bearing
 *
 * A rewrite that is sound on Mathlib at one release can silently change
 * meaning, stop compiling, or stop being an improvement at another
 * (`simp` lemma sets churn; tactics gain and lose behaviour). A folio's
 * `.lean` corpus is long-lived, so a strategy applied blind is a
 * latent breakage. Every strategy therefore declares the Lean range it
 * is known-good for, and the applicability query is version-gated
 * rather than best-effort.
 *
 * ## Confidence, not just applicability
 *
 * `verified` strategies have been applied and re-checked against a
 * build in this repo. `proposed` ones have not. An agent may apply a
 * `verified` strategy on its own; a `proposed` one is a suggestion for
 * a human. Nothing here is auto-applied without a compile check —
 * "correct-but-verbose" is the problem being solved, and trading it for
 * "concise-but-broken" is not progress.
 *
 * @module schemas/refactor-strategy
 */

/**
 * What a strategy optimises. Refactoring is genuinely multi-objective
 * and the objectives conflict — the shortest proof is often not the
 * cheapest to elaborate, and the most version-portable is often
 * neither.
 */
export type RefactorObjective =
  /** Fewer tactic steps / characters. */
  | "length"
  /** Lower elaboration cost. */
  | "compile-cost"
  /** Survives Lean/Mathlib upgrades better. */
  | "portability"
  /** Easier for a human to read. */
  | "legibility";

/**
 * How far a strategy can be trusted.
 *
 * - `verified` — applied in this repo and re-checked against a build.
 *   An agent may apply it unattended (still compile-checked after).
 * - `proposed` — plausible but unproven here. Suggest to a human;
 *   never apply unattended.
 * - `deprecated` — was verified, then broke (a Lean upgrade, a
 *   counter-example). Retained so it is not re-proposed from scratch;
 *   `superseded_by` points at the replacement where one exists.
 */
export type RefactorConfidence = "verified" | "proposed" | "deprecated";

/** Inclusive-lower, exclusive-upper Lean version range. */
export interface LeanVersionRange {
  /** e.g. `"4.17.0"`. Omit for "no lower bound known". */
  min?: string;
  /** e.g. `"4.30.0"`. Omit for "no known upper bound". */
  max?: string;
  /** Free-text note on why a bound exists (which lemma moved, etc.). */
  note?: string;
}

export interface RefactorStrategy {
  /** Stable kebab-case id, e.g. `drop-by-exact-wrapper`. */
  id: string;
  /** One-line statement of the rewrite. */
  description: string;
  objectives: RefactorObjective[];
  confidence: RefactorConfidence;
  /**
   * Lean versions this is known-good for. An empty/absent range means
   * UNKNOWN, not "all versions" — the query treats it as
   * non-applicable under strict gating, because an unbounded claim is
   * exactly the assumption that breaks on upgrade.
   */
  lean: LeanVersionRange;
  /**
   * Regex (JS syntax, source form) matching the shape to rewrite.
   * Optional: some strategies are structural and only an agent can
   * recognise them.
   */
  match?: string;
  /** Replacement template, when the rewrite is purely mechanical. */
  replace?: string;
  /** Illustrative before/after, always populated — it is the doc. */
  example: { before: string; after: string };
  /**
   * Expected gain, as a rough multiplier on the affected span
   * (0.5 = "about half the length/cost"). Indicative only; the
   * measured `proof-compile-cost` metric is the real evidence.
   */
  expected_gain?: number;
  /** Why NOT to apply this in some cases. Populated where known. */
  caveat?: string;
  /** For `deprecated`: the strategy that replaces this one. */
  superseded_by?: string;
  /** Provenance — paper, PR, or observation that produced it. */
  source?: string;
}

export interface RefactorStrategyFile {
  /** Schema marker — value: `refactor-strategy/v1`. */
  $schema: "refactor-strategy/v1";
  /** Grouping label, e.g. `mechanical`, `structural`. */
  family: string;
  strategies: RefactorStrategy[];
}

/**
 * Compare dotted version strings numerically (`"4.9.0" < "4.24.0"`).
 *
 * String comparison gets this wrong in exactly the range folio lives
 * in, so it is done component-wise.
 */
export function compareLeanVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Is a strategy applicable at `version`?
 *
 * Fails **closed**: a strategy with no declared range is not applicable
 * under strict gating. Silently applying an unbounded strategy is the
 * failure this metadata exists to prevent, so "unknown" must not read
 * as "fine".
 *
 * @param strict When false, an absent range is permitted (useful for
 *               listing candidates for a human, never for auto-apply).
 */
export function isApplicableAt(
  s: RefactorStrategy,
  version: string,
  strict = true,
): boolean {
  if (s.confidence === "deprecated") return false;
  const { min, max } = s.lean ?? {};
  if (min === undefined && max === undefined) return !strict;
  if (min !== undefined && compareLeanVersions(version, min) < 0) return false;
  if (max !== undefined && compareLeanVersions(version, max) >= 0) return false;
  return true;
}
