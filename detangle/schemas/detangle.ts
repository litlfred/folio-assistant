/**
 * Detangling — is this candidate subgraph really a subgraph?
 *
 * @module detangle/schemas/detangle
 * @graphNode schema
 *
 * ## The criterion, in the owner's words
 *
 * 2026-09-20:
 *
 * > *"candidate subgraph = large collection of thematiactally related content
 * > that is diconnected (maybe some light detagling) from other parts of the
 * > KG. (part of larger process detangle knwoedlge graph. look in lean, paper
 * > layout for related. generalize, make subprocess, deangle heuristics...)"*
 *
 * and, sharpening it:
 *
 * > *"other parts of graph are only referencing it... arrows mostly one way."*
 *
 * That second sentence is the one that turns a vague "disconnected" into
 * something checkable, and it is **not** the same as a small cut. A candidate
 * is a near-**sink**: the rest of the graph depends on it, and it depends on
 * almost nothing outside itself. A cluster with ten edges in and ten out has a
 * cut of twenty and cannot be lifted; one with fifty in and zero out has a cut
 * of fifty and lifts cleanly. **Cut size alone gets this backwards.**
 *
 * The same asymmetry is already encoded one graph over, in
 * `scripts/repo-partition.ts`'s `ALLOWED` table — each repo may import itself
 * plus its ancestors, and everything else is a "wrong-direction edge". A
 * near-sink is exactly a node set with no wrong-direction edges out of it.
 *
 * ## Four numbers, and only three of them are about size
 *
 *   - **size** — |S|. "Large" is in the definition; a two-node candidate is a
 *     file move and does not need a declaration.
 *   - **cohesion** — internal / (internal + boundary). "Thematically related"
 *     is a hypothesis; cohesion is the evidence for it. A directory whose files
 *     never reference each other is a folder, not a subgraph.
 *   - **inbound** — edges from the rest into S. High is GOOD: it is what makes
 *     the subgraph worth naming rather than deleting.
 *   - **outbound** — edges from S to the rest. **This is the one that must be
 *     near zero**, and every outbound edge is an item on the detangling
 *     worklist.
 *
 * `oneWayness = inbound / (inbound + outbound)` collapses the last two, and is
 * reported ALONGSIDE them rather than instead: 1.0 from `5/(5+0)` and 1.0 from
 * `500/(500+0)` are the same ratio and very different facts.
 *
 * ## The cut classification is the actual work
 *
 * The numbers say whether to look; the classification says what it would cost.
 * Every outbound edge is one of three things and only the first is free —
 * mirroring `repo-partition.ts`'s own worklist, whose entries are "a module
 * that must move, a dependency that must invert, or a documented exception".
 *
 * ## Three states, not two
 *
 * Taken verbatim from `repo-partition.ts`, and for the same reason it gives:
 * *"A module this tool cannot classify is reported as `unassigned`, never
 * silently bucketed into core… collapsing the two is how a wrong partition
 * looks like a clean one."* An edge whose kind cannot be determined is
 * `unclassified` and is counted separately — it is never quietly called
 * essential, because an unclassified edge is a question and an essential one
 * is an answer.
 *
 * ## Nothing here decides anything — taste is a declared step
 *
 * The owner, correcting a first draft of this module that had set "measured"
 * against "chosen by taste":
 *
 * > *"taste matters as judgement=human/agentic adjudication."*
 *
 * That is not a softening, it is the repository's existing model, and this
 * module was briefly at odds with it. `schemas/qa-review.ts` already separates
 * the two axes and says why: a `severity` is what a script can compute, a
 * `weight` is what only a reviewer with judgement can assign, and *"Only a
 * reviewer with judgement can speak here; a checker cannot, which is exactly
 * why this axis exists alongside the other."* `role-model.md` draws the same
 * line between an agentic actor and a mechanical one — *"an agent exercises
 * judgement; a mechanical system executes a procedure"*.
 *
 * So this module is a **mechanical reviewer**. It emits {@link DetangleFinding}
 * with a `script` reviewer and a `severity`, and it has no opinion about
 * whether to carve. The carve is a `Decision` by a human or agentic
 * adjudicator, in the shape `qa-review.ts` already defines, and it may
 * **overrule** any finding here — a theme a scanner cannot see is a real
 * reason, and so is a boundary somebody intends to enforce before the edges
 * exist to prove it.
 *
 * What the numbers buy is not authority. It is that the adjudication becomes
 * **reviewable**: "carved anyway, cohesion 0.31, because X" is a durable claim
 * somebody can disagree with later, and "it felt right" is not. Same argument
 * `kg:audit` makes for writing sidecars instead of printing a verdict — a
 * printed objection is gone, and "nobody raised this" and "somebody raised it
 * and it was answered" become indistinguishable.
 *
 * Consequently a failing clause is **never** a refusal. `failingClauses`
 * returns the clauses, not a boolean, precisely so the adjudicator can answer
 * them one at a time.
 */

/** A node in whatever graph is being detangled. Deliberately not a file: modules, skills, blocks and Lean declarations are all nodes. */
export interface DetangleNode {
  id: string;
  /** The candidate grouping under test — a directory, a package, a proposed repo. */
  group: string;
}

/** A directed edge. `from` depends on / references `to`. */
export interface DetangleEdge {
  from: string;
  to: string;
  /** How the edge was found, e.g. `md-link`, `bpmn-skill-ref`, `ts-import`. Provenance, so a surprising edge can be re-checked rather than argued with. */
  via: string;
}

/**
 * What an outbound edge would cost to remove.
 *
 * Ordered cheapest-first. The order is the review order: a candidate whose
 * outbound edges are all restatements is a rename away from being a subgraph,
 * and one whose edges are all essential needs a declared dependency before it
 * can move at all.
 */
export const CUT_KINDS = ["restatement", "wrong-direction", "essential", "unclassified"] as const;
export type CutKind = (typeof CUT_KINDS)[number];

export interface ClassifiedEdge extends DetangleEdge {
  kind: CutKind;
  /** Why it was classified so. A classification with no basis is an assertion. */
  basis: string;
}

export interface DetangleMetrics {
  group: string;
  size: number;
  /** Edges with both ends inside the group. */
  internal: number;
  /** Edges from outside INTO the group. High is good. */
  inbound: number;
  /** Edges from the group OUT. Must be near zero; each is a worklist item. */
  outbound: number;
  /** internal / (internal + inbound + outbound). Zero when the group has no edges at all — which is a folder, not a subgraph. */
  cohesion: number;
  /** inbound / (inbound + outbound). Reported with the raw counts, never instead of them. */
  oneWayness: number;
  /** The outbound edges themselves — the detangling worklist. */
  worklist: DetangleEdge[];
}

/** Metrics for one candidate group. */
export function measure(group: string, nodes: DetangleNode[], edges: DetangleEdge[]): DetangleMetrics {
  const inGroup = new Set(nodes.filter((n) => n.group === group).map((n) => n.id));
  const known = new Map(nodes.map((n) => [n.id, n.group]));
  let internal = 0;
  let inbound = 0;
  const worklist: DetangleEdge[] = [];
  for (const e of edges) {
    // An edge to a node we do not know about is not an edge out of the group —
    // it is an unresolved reference, and counting it as outbound would make
    // every group with a broken link look tangled. It is reported by the
    // scanner as a dangling reference instead, which is a different finding.
    if (!known.has(e.from) || !known.has(e.to)) continue;
    const f = inGroup.has(e.from);
    const t = inGroup.has(e.to);
    if (f && t) internal += 1;
    else if (!f && t) inbound += 1;
    else if (f && !t) worklist.push(e);
  }
  const outbound = worklist.length;
  const total = internal + inbound + outbound;
  return {
    group,
    size: inGroup.size,
    internal,
    inbound,
    outbound,
    cohesion: total === 0 ? 0 : internal / total,
    oneWayness: inbound + outbound === 0 ? 0 : inbound / (inbound + outbound),
    worklist,
  };
}

/**
 * Whether a group is a candidate, and if not, which clause it fails.
 *
 * Returns the FAILING CLAUSES rather than a boolean, for the reason
 * `freshness()` in `materialization.ts` returns four verdicts: "too small",
 * "not actually related" and "still wired into everything" call for three
 * different responses, and a boolean sends all three down one branch.
 */
export const DEFAULT_THRESHOLDS = {
  /** "large collection" — below this it is a file move. */
  minSize: 5,
  /** "thematically related" — the files must actually reference each other. */
  minCohesion: 0.5,
  /** "arrows mostly one way" — the owner's clause, as a number. */
  minOneWayness: 0.8,
  /** "maybe some light detangling" — how many outbound edges still counts as light. */
  maxOutbound: 3,
} as const;

export type Thresholds = typeof DEFAULT_THRESHOLDS;

export function failingClauses(m: DetangleMetrics, t: Thresholds = DEFAULT_THRESHOLDS): string[] {
  const out: string[] = [];
  if (m.size < t.minSize) out.push(`size ${m.size} < ${t.minSize} — a file move, not a subgraph`);
  if (m.cohesion < t.minCohesion)
    out.push(
      `cohesion ${m.cohesion.toFixed(2)} < ${t.minCohesion} — the members barely reference each other, ` +
        `so "thematically related" is asserted rather than shown`,
    );
  if (m.oneWayness < t.minOneWayness)
    out.push(
      `one-wayness ${m.oneWayness.toFixed(2)} < ${t.minOneWayness} — it references outward as much as it is ` +
        `referenced, so it is entangled rather than depended upon`,
    );
  if (m.outbound > t.maxOutbound)
    out.push(`${m.outbound} outbound edges > ${t.maxOutbound} — more than "light detangling"`);
  return out;
}

/**
 * A finding this scanner raises, in the shape `schemas/qa-review.ts` defines.
 *
 * Deliberately NOT a bespoke verdict type. The review model already has a
 * reviewer kind for a script, a machine severity axis, and a `Decision` by
 * which an adjudicator may overrule — inventing a second vocabulary here would
 * give this repository two answers to "what did the check say and what did we
 * do about it", free to disagree.
 */
export interface DetangleFinding {
  /** Unique within the sweep. */
  id: string;
  /** The candidate group. */
  subject: string;
  /** Which clause of the criterion produced it. */
  criterion: "size" | "cohesion" | "one-wayness" | "outbound";
  /** Always `script` here: this module computes and never judges. */
  reviewer: { kind: "script"; id: string };
  /** The machine axis. `major` throughout: a failing clause is a reason to look, not a reason to stop. */
  severity: "major";
  detail: string;
  /** The numbers behind it, so an adjudicator argues with evidence rather than with a verdict. */
  metrics: DetangleMetrics;
}

/**
 * Raise one finding per failing clause. An empty result means every clause
 * passed — it does NOT mean the group should be carved, which is not this
 * module's call to make.
 */
export function findings(
  m: DetangleMetrics,
  t: Thresholds = DEFAULT_THRESHOLDS,
  scannerId = "detangle/schemas/detangle.ts",
): DetangleFinding[] {
  const clauseOf = (d: string): DetangleFinding["criterion"] =>
    d.startsWith("size") ? "size"
    : d.startsWith("cohesion") ? "cohesion"
    : d.startsWith("one-wayness") ? "one-wayness"
    : "outbound";
  return failingClauses(m, t).map((detail, i) => ({
    id: `${m.group}#${i}`,
    subject: m.group,
    criterion: clauseOf(detail),
    reviewer: { kind: "script", id: scannerId },
    severity: "major",
    detail,
    metrics: m,
  }));
}
