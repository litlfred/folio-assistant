#!/usr/bin/env bun
/**
 * Paper/Lean QA checkers for the `uses` axis (`uses-formal-coverage` and
 * `lean-ref-owns-decl`), split out of `cat-harness-tools/pipeline/qa-checkers-uses.ts`
 * per owner ruling Q4 (bean `saqd` Group 8).
 *
 * Generic editorial `uses[]` hygiene (`uses-editorial-hygiene`) remains in
 * `cat-harness-tools/pipeline/qa-checkers-uses.ts`.
 *
 * @module folio-assistant-sci/pipeline/qa-checkers-uses
 */

import { folioDir } from "../../cat-harness-tools/schemas/kg/cat-harness.js";
import { existsSync, readFileSync } from "fs";
import type { CheckerResult } from "../../cat-harness-tools/schemas/sdlc/block-qa.ts";

import {
  buildContentGraph,
  isStatementKind,
  refToDecl,
  type ContentGraph,
} from "../../cat-harness-tools/pipeline/content-graph.ts";
import { findContentRepoRoot } from "../../cat-harness-tools/pipeline/repo-root.ts";

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
    const folioRoot = folioDir(repoRoot);
    if (!existsSync(folioRoot)) return null;
    _graph = buildContentGraph(folioRoot, repoRoot);
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

function label(tsPath: string): string | undefined {
  try {
    return readFileSync(tsPath, "utf-8").match(/\blabel\s*:\s*"([^"]+)"/)?.[1];
  } catch {
    return undefined;
  }
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
      notes: "content graph unavailable (no folio/ root found)",
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
  "uses-formal-coverage": (p) => checkUsesFormalCoverage(p.ts),
  "lean-ref-owns-decl": (p) => checkLeanRefOwnsDecl(p.ts),
};

// ── lean-ref-owns-decl ──────────────────────────────────────────
//
// Lives here rather than in a `lean-*` module because it audits the
// SAME thing the uses axis does: whether a block's declared
// relationships are truthful. It shares the memoized graph.

/**
 * A block's `lean.ref` must not collide with another *statement-bearing*
 * block's.
 *
 * A `prop:x` / `prf:x` pair sharing one declaration is LEGITIMATE and
 * common — the proposition is what the decl states, and the proof block
 * documents its proof. Flagging those would bury the real defect in
 * noise.
 *
 * Two statement-bearing blocks (definition / theorem / lemma /
 * proposition / corollary / conjecture) claiming one declaration is a
 * defect, and a consequential one: the formal graph can attach a decl to
 * only one block, so the other silently loses every formal edge it
 * should have had. In practice these are copy-paste errors — a real
 * corpus turned up a "Unital subset" definition pointing at a
 * Gröbner-basis declaration.
 */
export function checkLeanRefOwnsDecl(tsPath?: string): CheckerResult {
  if (!tsPath || !existsSync(tsPath)) return { result: "n/a", hits: [] };
  const g = graph();
  if (!g) {
    return { result: "n/a", hits: [], notes: "content graph unavailable" };
  }
  const me = label(tsPath);
  if (!me) return { result: "n/a", hits: [] };
  const node = g.nodes.get(me);
  if (!node?.leanRef) return { result: "n/a", hits: [] }; // no ref to own

  const decl = refToDecl(node.leanRef);
  if (!decl) return { result: "n/a", hits: [] };
  const owners = g.declOwners.get(decl) ?? [];
  const statementOwners = owners.filter((l) =>
    isStatementKind(g.nodes.get(l)?.kind ?? ""),
  );

  const metrics = { decl_claimants: owners.length };
  if (statementOwners.length <= 1) return { result: "pass", hits: [], metrics };

  // Report from every claimant so the finding is visible on each side.
  const others = statementOwners.filter((l) => l !== me);
  return {
    result: "fail",
    hits: [
      {
        file: tsPath,
        line: 1,
        text:
          `lean.ref "${node.leanRef}" is also claimed by ${others
            .map((l) => `"${l}"`)
            .join(", ")}. A declaration can be owned by only ONE ` +
          `statement-bearing block — the formal graph attaches it to one, ` +
          `and the other silently loses its formal edges. (A prop/proof ` +
          `pair sharing a decl is fine and is not reported.)`,
      },
    ],
    metrics,
  };
}
