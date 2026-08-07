#!/usr/bin/env bun
/**
 * Machine-triviality oracle — scaffold.
 *
 * ## The idea
 *
 * Nazrin (arXiv 2602.18767) is a GNN over a minimal Lean expression
 * graph that emits *atomic* tactics from a small fixed action space. It
 * trains and runs on consumer hardware. As a prover it will not beat the
 * frontier model already in the loop.
 *
 * Inverted, it is useful: **if a cheap CPU model closes the goal in a
 * handful of atomic tactics from cold, the statement probably carries no
 * content.** That is what folio's vacuity family exists to catch —
 * `proof-no-trivial-true`, `proof-no-trivial-skeleton`,
 * `proof-rater-novelty`, `proof-no-decide-masking` — and five of its six
 * criteria are `automated: false`, so they burn agent turns on every
 * sweep. A cheap pre-filter changes which blocks an agent looks at
 * first.
 *
 * ## Status: UNVALIDATED
 *
 * The oracle's false-positive rate has **not** been measured on any
 * corpus. Its entire value is that number: if it flags genuine results
 * as trivial, it costs more attention than it saves. Plenty of real
 * theorems are one-liners.
 *
 * So this is deliberately inert until fed real data:
 *
 * - `n/a` with no cache — and an empty cache means "not measured", not
 *   "nothing trivial".
 * - `warn` at worst, never `fail`. It is a prompt for human review, not
 *   a verdict.
 * - The criterion is `minor`, so it cannot gate a build.
 *
 * Before promoting any of that, run the oracle over a real corpus and
 * measure how often a flagged block turns out to be substantive. See
 * bean `nimj`.
 *
 * ## Cache format
 *
 * `docs/audits/lean-triviality.json`, ingested the same way as the other
 * audit caches (agent- or CI-driven, SHA-stamped so a stale measurement
 * is detectable):
 *
 *   { "$schema": "lean-triviality/v1",
 *     "generated_at": "...",
 *     "oracle": "nazrin@<rev>",
 *     "decls": { "<Decl>": { "closed": true, "steps": 3,
 *                            "lean_path": "...", "lean_sha": "..." } } }
 *
 * @module content/pipeline/qa-checkers-triviality
 */

import { existsSync, readFileSync } from "fs";
import { join, resolve, extname, sep } from "path";
import type { CheckerResult } from "./qa-checkers-extended";
import { parseLeanRef, refToDecl } from "./content-graph";
import { hashFile } from "./qa-utils";
import { findContentRepoRoot } from "./repo-root";

const CACHE_REL = "docs/audits/lean-triviality.json";

/**
 * Atomic-tactic count at or below which a closed goal is considered
 * suspiciously easy.
 *
 * A guess, not a measured threshold — see the UNVALIDATED note above.
 * Tuning it is part of the evaluation this scaffold is waiting on.
 */
export const TRIVIAL_STEP_THRESHOLD = 3;

export interface TrivialityEntry {
  /** Did the oracle close the goal at all? */
  closed: boolean;
  /** Atomic tactic steps used. Absent when `closed` is false. */
  steps?: number;
  lean_path?: string;
  lean_sha?: string;
  checked_at?: string;
}

export interface TrivialityCache {
  $schema: "lean-triviality/v1";
  generated_at: string;
  /** Oracle identity + revision — a threshold is meaningless without it. */
  oracle: string;
  decls: Record<string, TrivialityEntry>;
}

let _cache: TrivialityCache | null = null;
let _root: string | null = null;
let _tried = false;

function cache(): { cache: TrivialityCache; root: string } | null {
  if (!_tried) {
    _tried = true;
    try {
      _root = findContentRepoRoot();
      const p = join(_root, CACHE_REL);
      if (existsSync(p)) _cache = JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      _cache = null;
    }
  }
  if (!_cache || !_root || Object.keys(_cache.decls ?? {}).length === 0) return null;
  return { cache: _cache, root: _root };
}

/** Test hook: drop the memoized cache. */
export function resetTrivialityCache(): void {
  _cache = null;
  _root = null;
  _tried = false;
}

/** Containment + extension guard, matching the other ingest caches. */
function leanSha(root: string, p: string): string | undefined {
  const abs = resolve(root, p);
  if (abs !== root && !abs.startsWith(root + sep)) return undefined;
  if (extname(abs) !== ".lean") return undefined;
  return hashFile(abs);
}

/**
 * Flag a block whose goal a weak oracle closed in very few steps.
 *
 * Never fails. `n/a` when unmeasured or stale — a measurement taken
 * against different source says nothing about the current statement.
 */
export function checkProofNotMachineTrivial(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const c = cache();
  if (!c) {
    return {
      result: "n/a",
      hits: [],
      notes: `no ${CACHE_REL} — triviality not measured (absence of data, not absence of triviality)`,
    };
  }
  let decl: string | undefined;
  try {
    decl = refToDecl(parseLeanRef(readFileSync(tsPath, "utf-8")));
  } catch {
    return { result: "n/a", hits: [] };
  }
  if (!decl) return { result: "n/a", hits: [] };

  const e = c.cache.decls[decl];
  if (!e) return { result: "n/a", hits: [], notes: `no oracle run for ${decl}` };
  if (e.lean_path && e.lean_sha && leanSha(c.root, e.lean_path) !== e.lean_sha) {
    return { result: "n/a", hits: [], notes: "oracle measurement is stale (.lean changed)" };
  }

  const metrics: Record<string, number | string> = {
    oracle: c.cache.oracle ?? "unknown",
    oracle_closed: e.closed ? 1 : 0,
  };
  if (e.steps !== undefined) metrics.atomic_steps_to_close = e.steps;

  if (!e.closed) return { result: "pass", hits: [], metrics };
  const steps = e.steps ?? 0;
  if (steps > TRIVIAL_STEP_THRESHOLD) return { result: "pass", hits: [], metrics };

  return {
    result: "warn",
    hits: [
      {
        file: tsPath,
        line: 1,
        text:
          `a weak oracle (${c.cache.oracle ?? "unknown"}) closed this goal in ` +
          `${steps} atomic tactic${steps === 1 ? "" : "s"} from cold. That is a ` +
          `PROMPT to check whether the statement carries content — not a verdict. ` +
          `Genuine one-line results exist; route to lean-proof-vacuity-audit.`,
      },
    ],
    metrics,
  };
}

export const TRIVIALITY_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "proof-not-machine-trivial": (p) => checkProofNotMachineTrivial(p.ts),
};
