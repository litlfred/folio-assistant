#!/usr/bin/env bun
/**
 * QA checkers for the `uses` axis — proper use of the **editorial**
 * dependency relation.
 *
 * `uses[]` records what a *reader* must have read to follow a block.
 * It is agent/human maintained. It is NOT the formal dependency graph
 * — that is machine-derived from `lean.ref` (see `content-graph.ts`).
 *
 * These checkers therefore audit `uses[]` **as an editorial artefact**:
 * is it well-formed, and does it read as a deliberate judgement? They
 * never compare it to Lean for the purpose of correcting it. The one
 * checker that looks at both relations (`uses-formal-coverage`) reports
 * an advisory exposition-gap signal and is incapable of failing a
 * build.
 *
 * @module content/pipeline/qa-checkers-uses
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { CheckerResult } from "./qa-checkers-extended";
import { buildContentGraph, extractUses, type ContentGraph } from "./content-graph";
import { findContentRepoRoot } from "./repo-root";

// ── Shared graph (built once per process) ───────────────────────
//
// Built over the whole `content/` tree, not a single paper, so
// cross-paper `paper-dir:label` references resolve. `_graphLoaded`
// gates on a *successful* build: a missing content root must yield
// `n/a`, never a false "everything passes".

let _graph: ContentGraph | null = null;
let _graphLoaded = false;
let _graphTried = false;

function graph(): ContentGraph | null {
  if (_graphTried) return _graphLoaded ? _graph : null;
  _graphTried = true;
  try {
    const repoRoot = findContentRepoRoot();
    const contentDir = join(repoRoot, "content");
    if (!existsSync(contentDir)) return null;
    _graph = buildContentGraph(contentDir, repoRoot);
    _graphLoaded = _graph.nodes.size > 0;
    return _graphLoaded ? _graph : null;
  } catch {
    return null;
  }
}

/** Test hook: drop the memoized graph so a test can rebuild it. */
export function resetUsesGraphCache(): void {
  _graph = null;
  _graphLoaded = false;
  _graphTried = false;
}

/**
 * A `uses[]` entry that is not a bare in-paper label.
 *
 * Cross-folio refs are absolute URLs; cross-paper refs are
 * `paper-dir:label`. Neither can be resolved against the blocks walked
 * here without fetching or assuming a sibling checkout, so both are
 * accepted as-is. (`schemas/constraints.ts` → `uses-resolve` owns
 * deeper validation of those forms.)
 *
 * A bare label always contains a kind prefix (`def:`, `thm:`, …), so
 * the discriminator is whether anything precedes that prefix.
 */
const KIND_PREFIX =
  /^(def|thm|lem|prop|cor|conj|rem|ex|eq|fig|alg|sim|prose|diagram):/;

function isExternalRef(u: string): boolean {
  if (/^https?:\/\//.test(u)) return true;
  // `paper-dir:def:foo` — a kind prefix appears, but not at position 0.
  return !KIND_PREFIX.test(u) && u.includes(":");
}

function label(tsPath: string): string | undefined {
  try {
    return readFileSync(tsPath, "utf-8").match(/\blabel\s*:\s*"([^"]+)"/)?.[1];
  } catch {
    return undefined;
  }
}

// ── uses-editorial-hygiene (MECHANICAL) ─────────────────────────

/**
 * Structural well-formedness of `uses[]` as an editorial list.
 *
 * Checks, in order of severity:
 *  1. self-reference — a block cannot be its own prerequisite;
 *  2. unresolvable bare label — points at no block in the corpus;
 *  3. duplicate entry — inflates every degree/cone metric downstream;
 *  4. transitive redundancy — A uses B, B uses C, A also lists C.
 *
 * (4) is sound on the editorial relation specifically: reading-order
 * IS transitive, so listing C adds nothing a reader gains. It is never
 * applied to formal edges, where a direct dependency is a fact about
 * the proof term rather than a claim about reading order.
 */
export function checkUsesEditorialHygiene(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const g = graph();
  if (!g) {
    return {
      result: "n/a",
      hits: [],
      notes: "content graph unavailable (no content/ root found)",
    };
  }
  const src = readFileSync(tsPath, "utf-8");
  const me = label(tsPath);
  if (!me) return { result: "n/a", hits: [] };

  // Raw (pre-dedup) list: `parseUses` deduplicates, which is right for
  // the graph but would hide a duplicate entry from this check.
  const extracted = extractUses(src);
  const raw = extracted?.entries ?? [];
  if (raw.length === 0) return { result: "pass", hits: [] };

  const usesLine = src.slice(0, extracted!.index).split("\n").length || 1;
  const hits: Array<{ file: string; line: number; text: string }> = [];
  const hit = (text: string) => hits.push({ file: tsPath, line: usesLine, text });

  // Defects are graded. A broken edge (1-3) corrupts the graph every
  // downstream metric is computed from, so it fails. Transitive
  // redundancy (4) is a tidiness lint — the graph it produces is still
  // correct, just not minimal — so it warns. Rolling both into one
  // `fail` would bury the handful of real breakages under a flood of
  // lint (on the qou corpus: ~350 redundancies, single-digit breakages).
  let broken = 0;

  // 1. self-reference
  if (raw.includes(me)) {
    hit(`self-reference: uses[] lists its own label "${me}"`);
    broken++;
  }

  // 2. unresolvable bare label
  for (const u of raw) {
    if (isExternalRef(u)) continue;
    if (!g.nodes.has(u)) {
      hit(`unresolvable dependency "${u}" — no block in the corpus has that label`);
      broken++;
    }
  }

  // 3. duplicates
  const seen = new Set<string>();
  for (const u of raw) {
    if (seen.has(u)) {
      hit(`duplicate entry "${u}" — listed more than once`);
      broken++;
    }
    seen.add(u);
  }

  // 4. transitive redundancy: an entry also reachable through another
  //    entry. Walk the editorial relation only.
  const direct = [...seen];
  let redundant = 0;
  for (const u of direct) {
    for (const other of direct) {
      if (other === u) continue;
      if (g.cone(other, "editorial").has(u)) {
        hit(
          `transitively redundant "${u}" — already reachable via "${other}"; ` +
            `run prune-transitive-deps.ts`,
        );
        redundant++;
        break;
      }
    }
  }

  return {
    result: broken > 0 ? "fail" : redundant > 0 ? "warn" : "pass",
    hits,
    metrics: {
      uses_count: direct.length,
      broken_edges: broken,
      redundant_edges: redundant,
    },
  };
}

// ── uses-formal-coverage (ADVISORY) ─────────────────────────────

/** How many formal-only targets to name in the metrics sample. */
const SAMPLE_LIMIT = 5;

/**
 * Advisory exposition-gap signal.
 *
 * Reports formal (Lean) dependencies whose owning block is unreachable
 * through this block's editorial cone. **This is not a list of missing
 * `uses[]` entries.** Most formal-only edges are correct and belong
 * nowhere near `uses[]` — `simp` lemmas, typeclass instances, library
 * plumbing. The finding exists so a human can ask, per edge, whether
 * the narrative owes the reader an introduction.
 *
 * Never fails: the worst verdict is `warn`, and the criterion's
 * registry severity is `minor`. Returns `n/a` when the Atlas cache is
 * absent, because an empty formal edge set then means "unavailable",
 * not "clean".
 */
export function checkUsesFormalCoverage(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const g = graph();
  if (!g) {
    return {
      result: "n/a",
      hits: [],
      notes: "content graph unavailable (no content/ root found)",
    };
  }
  if (!g.hasFormal) {
    return {
      result: "n/a",
      hits: [],
      notes:
        "no docs/audits/lean-atlas-deps.json — formal dependency graph " +
        "unavailable; empty formal edge set means unavailable, not clean",
    };
  }
  const me = label(tsPath);
  if (!me || !g.nodes.has(me)) return { result: "n/a", hits: [] };

  const formalOnly = g.formalOnlyTargets(me);
  const editorialOnly = g.editorialOnlyTargets(me);

  const metrics: Record<string, number | string> = {
    formal_only_count: formalOnly.length,
    editorial_only_count: editorialOnly.length,
  };
  if (formalOnly.length) {
    metrics.formal_only_sample = formalOnly.slice(0, SAMPLE_LIMIT).join(", ");
  }

  if (formalOnly.length === 0) return { result: "pass", hits: [], metrics };

  // Evidence carries the inducing decl pair so a reviewer can see why
  // the graph relates the two blocks without re-running Atlas.
  const byTarget = new Map<string, string>();
  for (const e of g.outEdges(me, "formal")) {
    if (e.via && !byTarget.has(e.to)) byTarget.set(e.to, e.via);
  }
  const hits = formalOnly.slice(0, SAMPLE_LIMIT).map((t) => ({
    file: tsPath,
    line: 1,
    text:
      `formal dependency on "${t}" is outside this block's editorial cone ` +
      `(${byTarget.get(t) ?? "decl pair unknown"}) — candidate exposition ` +
      `gap; NOT necessarily a missing uses[] entry`,
  }));

  return { result: "warn", hits, metrics };
}

// ── Registry ────────────────────────────────────────────────────

/**
 * Automated checkers for the `uses` axis, merged into
 * `AUTOMATED_CHECKERS` by `qa-checkers-voice.ts`.
 *
 * `uses-editorial-completeness` is deliberately absent: it is
 * `automated: false` in the registry, adjudicated by an agent or human
 * reading the narrative.
 */
export const USES_AUTOMATED_CHECKERS: Record<
  string,
  (paths: { md?: string; ts?: string; lean?: string }) => CheckerResult
> = {
  "uses-editorial-hygiene": (p) => checkUsesEditorialHygiene(p.ts),
  "uses-formal-coverage": (p) => checkUsesFormalCoverage(p.ts),
};
