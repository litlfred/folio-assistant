#!/usr/bin/env bun
/**
 * Semantic-impact scoping — folio's implementation of the Lean Compass
 * idea from Lean Atlas (arXiv 2604.16347).
 *
 * ## The question
 *
 * The expensive QA criteria are the ones a machine cannot settle:
 * `proof-narrative-lean-equiv`, `proof-statement-integrity`, the
 * vacuity family, the `proof-rater-*` scores. All are
 * `automated: false`, so each costs agent turns, and a sweep that walks
 * the corpus in file order spends most of them on blocks that cannot
 * affect anything anyone cares about.
 *
 * Compass answers: **given the theorems that matter, whose semantic
 * correctness can actually affect them?**
 *
 * ## Why type edges only
 *
 * "Semantic correctness" means *the formalisation encodes the intended
 * mathematics* — a question no compiler can answer, which is why these
 * criteria need a human or an agent. It propagates differently from
 * logical dependency:
 *
 * - A **type** edge (the declaration's *signature* mentions the target)
 *   propagates semantic risk. If `T`'s statement is phrased in terms of
 *   `D`, and `D` encodes the wrong notion, then `T` claims something
 *   other than intended — however impeccable its proof.
 *
 * - A **value** edge (only the *proof term* mentions the target) does
 *   not. If `T`'s proof invokes lemma `L`, the kernel has already
 *   checked that `T` follows from `L`. Whether `L` means what its
 *   author intended does not change what `T` *claims*.
 *
 * So the semantic cone is the transitive closure over **type edges
 * only**. Value edges terminate propagation, and that termination is
 * the entire reduction — the reason a 227-node project collapses to 14
 * nodes needing semantic review.
 *
 * ## Confidence
 *
 * The type/value split is only as good as its source. Under
 * `formalSource: "atlas"` it is elaborated and trustworthy. Under
 * `"scan"` it is a lexical guess from
 * `lean-atlas-ingest.ts --scan`, so the cone is indicative, not
 * authoritative — a missed type edge silently shrinks it, which is the
 * dangerous direction. With no formal graph at all the cone degrades to
 * the editorial relation, which answers a different question entirely
 * and is reported as such.
 *
 * **Never present a `scan` or `editorial-only` cone as proof that
 * review is complete.** Use it to decide what to review *first*.
 *
 * ## Usage
 *
 *   bun run content/pipeline/semantic-cone.ts --targets thm:a,thm:b
 *   bun run content/pipeline/semantic-cone.ts --targets thm:a --coverage
 *   bun run content/pipeline/semantic-cone.ts --targets thm:a --json
 *
 * @module content/pipeline/semantic-cone
 */

import { join } from "path";
import { buildContentGraph, type ContentGraph, type FormalSource } from "./content-graph";
import { findContentRepoRoot } from "./repo-root";
import { walkBlocks, loadQaReport, hashBlockFiles, entryIsFresh, freshnessKeys } from "./qa-utils";
import { QA_CRITERIA_REGISTRY, QA_CRITERIA_BY_ID } from "./qa-criteria-registry";

/**
 * How much to trust a cone.
 *
 * - `atlas` — elaborated type/value split. Authoritative.
 * - `scan` — lexical split. Indicative; may UNDER-report (a missed type
 *   edge shrinks the cone, hiding work that is owed).
 * - `editorial-only` — no formal graph. This is the `uses[]` reading
 *   cone, which answers "what must a reader have read", not "what can
 *   affect this statement's meaning". Different question; reported so
 *   it is never mistaken for the real one.
 */
export type ConeConfidence = FormalSource | "editorial-only";

export interface SemanticCone {
  targets: string[];
  /** Targets not present in the graph (typo'd or cross-paper labels). */
  unknownTargets: string[];
  /** Nodes whose semantic correctness can affect the targets. */
  members: Set<string>;
  confidence: ConeConfidence;
  /**
   * True when the cone is exactly its targets — no edge was traversed.
   *
   * This is an ABSENCE OF DATA, not a result. The targets have no
   * outgoing statement-level edges in the graph, which under `scan`
   * usually means their `.lean` siblings do not syntactically mention
   * another block-owned declaration. Reporting the accompanying
   * `reduction.pct` (which will be ~100%) without this flag would
   * present missing data as a triumphant scope reduction.
   */
  noPropagation: boolean;
  /** Corpus size vs cone size — the review-scope reduction. */
  reduction: { corpus: number; cone: number; pct: number };
}

/**
 * Compute the semantic-impact cone of a target set.
 *
 * Targets are included in their own cone: a theorem's own statement is
 * the first thing whose faithfulness matters.
 */
export function semanticCone(g: ContentGraph, targets: string[]): SemanticCone {
  const known = targets.filter((t) => g.nodes.has(t));
  const unknownTargets = targets.filter((t) => !g.nodes.has(t));

  const confidence: ConeConfidence = g.hasFormal
    ? (g.formalSource ?? "scan")
    : "editorial-only";

  // With no formal graph, fall back to the editorial relation and say
  // so. It is the wrong relation for this question, but an empty cone
  // would read as "nothing to review", which is worse.
  const edgeKind = g.hasFormal ? "formal" : "editorial";

  const members = new Set<string>(known);
  const stack = [...known];
  while (stack.length) {
    const n = stack.pop()!;
    for (const e of g.outEdges(n, edgeKind)) {
      // The reduction lives here: proof-level edges do not carry
      // semantic risk to the target's statement.
      if (edgeKind === "formal" && e.formalKind !== "type") continue;
      if (members.has(e.to)) continue;
      members.add(e.to);
      stack.push(e.to);
    }
  }

  const corpus = g.nodes.size;
  return {
    targets: known,
    unknownTargets,
    members,
    confidence,
    // A cone containing nothing but its own targets means no edge was
    // traversed. Callers must not read that as a spectacular reduction
    // — see `noPropagation`.
    noPropagation: known.length > 0 && members.size === known.length,
    reduction: {
      corpus,
      cone: members.size,
      pct: corpus ? Math.round((1 - members.size / corpus) * 1000) / 10 : 0,
    },
  };
}

/**
 * The criteria this scoping exists to ration: registry entries that
 * need an agent or a human. Derived from the registry rather than
 * hard-coded, so a newly-added `automated: false` criterion is covered
 * without touching this file.
 */
export function agentCheckedCriteria(): string[] {
  return QA_CRITERIA_REGISTRY.filter(
    (c) => !c.automated && (c.domain === "proof" || c.domain === "proof-rater"),
  ).map((c) => c.id);
}

export interface CoverageRow {
  label: string;
  /** Criteria with no fresh adjudication for this block. */
  missing: string[];
}

/**
 * Review-coverage report over a cone: which members still lack a
 * **fresh** adjudication of each agent-checked criterion.
 *
 * Freshness is the existing sidecar contract — an entry counts only if
 * its `field_hash` still matches the block's current source files, so a
 * block edited since its last review reads as unreviewed.
 *
 * This turns "have we reviewed enough?" from a judgement call into a
 * computed answer, *within the stated confidence of the cone*.
 */
export function coneCoverage(
  rootDir: string,
  cone: SemanticCone,
  criteria: string[] = agentCheckedCriteria(),
): CoverageRow[] {
  const rows: CoverageRow[] = [];
  for (const b of walkBlocks(rootDir)) {
    if (!cone.members.has(b.label)) continue;
    const report = b.qa ? loadQaReport(b.qa) : undefined;
    const current = hashBlockFiles({ md: b.md, ts: b.ts, lean: b.lean });
    const missing: string[] = [];
    for (const cid of criteria) {
      const entries = report?.criteria?.[cid] ?? [];
      // The file set comes from the registry so freshness matches what the
      // criterion was defined against — `depends_on` plus anything that
      // invalidates without gating applicability.
      const def = QA_CRITERIA_BY_ID[cid];
      const dependsOn = def ? freshnessKeys(def) : (["md", "ts", "lean"] as const).slice();
      const fresh = entries.some((e) =>
        entryIsFresh(e, current, dependsOn, undefined, QA_CRITERIA_BY_ID[cid]?.lean_granularity),
      );
      if (!fresh) missing.push(cid);
    }
    if (missing.length) rows.push({ label: b.label, missing });
  }
  return rows.sort((a, b) => b.missing.length - a.missing.length);
}

// ── CLI ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const wantCoverage = args.includes("--coverage");
  const ti = args.indexOf("--targets");
  const targets =
    ti !== -1 && args[ti + 1]
      ? args[ti + 1].split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const rootArg = args.find(
    (a, i) => !a.startsWith("--") && args[i - 1] !== "--targets",
  );

  const repoRoot = findContentRepoRoot();
  const rootDir = rootArg ? join(repoRoot, rootArg) : join(repoRoot, "content");

  if (targets.length === 0) {
    console.log(`Semantic-impact scoping (Lean Compass, arXiv 2604.16347).

  --targets <a,b,c>   Block labels whose semantic correctness matters
  --coverage          Also report cone members lacking a FRESH
                      adjudication of each agent-checked criterion
  --json              Machine-readable output

The cone is the transitive closure over TYPE (statement-level) edges.
Value (proof-level) edges terminate propagation — that termination is
the reduction. Confidence follows the formal graph's source; a "scan" or
"editorial-only" cone orders review, it does not certify completeness.`);
    process.exit(2);
  }

  const g = buildContentGraph(rootDir, repoRoot);
  const cone = semanticCone(g, targets);
  const coverage = wantCoverage ? coneCoverage(rootDir, cone) : undefined;

  if (json) {
    console.log(
      JSON.stringify(
        {
          ...cone,
          members: [...cone.members].sort(),
          coverage,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`semantic cone — confidence: ${cone.confidence}`);
    if (cone.confidence !== "atlas") {
      console.log(
        cone.confidence === "editorial-only"
          ? `  !! No formal graph. This is the EDITORIAL (uses[]) cone, which\n` +
              `     answers a different question. Ordering only — not coverage.`
          : `  !! Type/value split is lexical (--scan), not elaborated. A missed\n` +
              `     type edge shrinks this cone, so treat it as indicative.`,
      );
    }
    console.log(`  targets:  ${cone.targets.length}${cone.unknownTargets.length ? ` (unknown: ${cone.unknownTargets.join(", ")})` : ""}`);
    console.log(`  corpus:   ${cone.reduction.corpus}`);
    if (cone.noPropagation) {
      console.log(`  cone:     ${cone.reduction.cone}  (targets only — NO EDGES TRAVERSED)`);
      console.log(
        `\n  !! This is missing data, not a reduction. The targets have no\n` +
          `     statement-level edges in the graph. Under --scan that usually\n` +
          `     means their .lean siblings don't syntactically mention another\n` +
          `     block-owned decl. Do NOT read this as "only 3 blocks need review".`,
      );
    } else {
      console.log(`  cone:     ${cone.reduction.cone}  (${cone.reduction.pct}% reduction)`);
    }
    if (coverage) {
      const total = coverage.reduce((n, r) => n + r.missing.length, 0);
      console.log(`\nreview coverage: ${coverage.length}/${cone.reduction.cone} cone members have gaps (${total} criterion-blocks)`);
      for (const r of coverage.slice(0, 20)) {
        console.log(`  ${r.label}  —  ${r.missing.join(", ")}`);
      }
      if (coverage.length > 20) console.log(`  … and ${coverage.length - 20} more`);
    }
  }
}
