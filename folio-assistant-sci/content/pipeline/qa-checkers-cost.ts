#!/usr/bin/env bun
/**
 * QA checkers for proof elaboration cost.
 *
 * Makes refactoring gains measurable and regressions visible. A proof
 * can get shorter and slower at once — `simp` searching where an
 * explicit `rw` chain used to step — and without a recorded cost that
 * trade reads as a pure win.
 *
 * Both checkers read `docs/audits/lean-profile.json` (see
 * `lean-profile-ingest.ts`) and return `n/a` when the measurement is
 * missing or stale. Stale is treated as missing on purpose: a cost
 * compared across different source is not a weak signal, it is a
 * confident wrong one.
 *
 * ## Why this is in `folio-assistant-sci` and not the platform
 *
 * Elaboration cost is a LEAN measurement, so the checker is the science
 * layer's tooling, and `cat-harness` reaching it was a core → sci dependency.
 * `check:partition` never counted it, because `getCriterionSourceFile` named
 * this file as a STRING and a variable specifier is deliberately no edge — but
 * after the repository split the file still has to exist, in another package.
 * Bean `zlmp` measured five such runtime edges; this is the first one drained.
 *
 * The CRITERION stays in core (`qa-criteria-registry.ts` declares
 * `proof-compile-cost` and `proof-no-cost-regression`): a criterion is a rule
 * about content, and a checker is the tooling that answers it. That is the
 * owner's cut — *"f-a-core has high level processes only, no tooling"* — and
 * it is what `QaCheckerContribution` models, criterion id plus function plus
 * the file that defines it.
 *
 * @module folio-assistant-sci/content/pipeline/qa-checkers-cost
 */

import { existsSync, readFileSync } from "fs";
import type { CheckerResult } from "../../../cat-harness/schemas/block-qa";

import { parseLeanRef, refToDecl } from "../../../cat-harness/content/pipeline/content-graph";
import { loadProfileCache, entryFresh, type ProfileCache } from "../../../cat-harness/content/pipeline/lean-profile-ingest";
import { findContentRepoRoot } from "../../../cat-harness/content/pipeline/repo-root";

let _cache: ProfileCache | null = null;
let _root: string | null = null;

function cache(): { cache: ProfileCache; root: string } | null {
  if (!_cache || !_root) {
    try {
      _root = findContentRepoRoot();
      _cache = loadProfileCache(_root);
    } catch {
      return null;
    }
  }
  return Object.keys(_cache.decls).length ? { cache: _cache, root: _root } : null;
}

/** Test hook: drop the memoized cache. */
export function resetProfileCache(): void {
  _cache = null;
  _root = null;
}

function declFor(tsPath: string): string | undefined {
  try {
    return refToDecl(parseLeanRef(readFileSync(tsPath, "utf-8")));
  } catch {
    return undefined;
  }
}

/**
 * Record elaboration cost into the sidecar `metrics`.
 *
 * Pure measurement — always `pass` when data exists. It is not a
 * judgement about whether a proof is too slow; that threshold is
 * corpus-specific and setting one here would invent a policy nobody
 * agreed to. The value is the recorded number and its trend.
 */
export function checkProofCompileCost(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const c = cache();
  if (!c) {
    return { result: "n/a", hits: [], notes: "no docs/audits/lean-profile.json" };
  }
  const decl = declFor(tsPath);
  if (!decl) return { result: "n/a", hits: [] };
  const e = c.cache.decls[decl];
  if (!e) return { result: "n/a", hits: [], notes: `no profile measurement for ${decl}` };
  if (!entryFresh(c.root, e)) {
    return {
      result: "n/a",
      hits: [],
      notes: `profile measurement is stale (.lean changed since ${e.measured_at})`,
    };
  }
  const metrics: Record<string, number | string> = { elab_ms: Math.round(e.elab_ms) };
  if (e.tactic_count !== undefined) metrics.tactic_count = e.tactic_count;
  const prev = c.cache.previous[decl];
  if (prev?.elab_ms) {
    metrics.elab_ms_prev = Math.round(prev.elab_ms);
    metrics.elab_delta_pct = Math.round(((e.elab_ms - prev.elab_ms) / prev.elab_ms) * 1000) / 10;
  }
  return { result: "pass", hits: [], metrics };
}

/**
 * Materially slower than the previous measurement.
 *
 * The threshold is deliberately loose. Elaboration timing is noisy —
 * machine load, cache state, Lake parallelism — so a tight bound would
 * produce a stream of false regressions that trains reviewers to ignore
 * the signal. 25% catches the cases a refactor actually caused.
 */
export const COST_REGRESSION_THRESHOLD = 0.25;

export function checkProofNoCostRegression(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const c = cache();
  if (!c) return { result: "n/a", hits: [], notes: "no docs/audits/lean-profile.json" };
  const decl = declFor(tsPath);
  if (!decl) return { result: "n/a", hits: [] };
  const e = c.cache.decls[decl];
  const prev = c.cache.previous[decl];
  // No baseline is not a pass — there is nothing to compare.
  if (!e || !prev?.elab_ms) {
    return { result: "n/a", hits: [], notes: "no comparable prior measurement" };
  }
  if (!entryFresh(c.root, e)) {
    return { result: "n/a", hits: [], notes: "current measurement is stale" };
  }
  const delta = (e.elab_ms - prev.elab_ms) / prev.elab_ms;
  const metrics = {
    elab_ms: Math.round(e.elab_ms),
    elab_ms_prev: Math.round(prev.elab_ms),
    elab_delta_pct: Math.round(delta * 1000) / 10,
  };
  if (delta <= COST_REGRESSION_THRESHOLD) return { result: "pass", hits: [], metrics };
  return {
    result: "fail",
    hits: [
      {
        file: tsPath,
        line: 1,
        text:
          `elaboration cost regressed ${(delta * 100).toFixed(1)}% ` +
          `(${prev.elab_ms.toFixed(0)}ms -> ${e.elab_ms.toFixed(0)}ms) for ${decl}. ` +
          `If a statement change justifies it, re-baseline; otherwise the ` +
          `last edit made this proof materially more expensive.`,
      },
    ],
    metrics,
  };
}

export const COST_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "proof-compile-cost": (p) => checkProofCompileCost(p.ts),
  "proof-no-cost-regression": (p) => checkProofNoCostRegression(p.ts),
};
