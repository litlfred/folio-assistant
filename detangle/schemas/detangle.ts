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
import type { DirectionVerdict } from "../../cat-harness/schemas/layer-direction.js";

/** A node in whatever graph is being detangled. Deliberately not a file: modules, skills, blocks and Lean declarations are all nodes. */
export interface DetangleNode {
  id: string;
  /** The candidate grouping under test — a directory, a package, a proposed repo. */
  group: string;
}

/**
 * Which way a group's boundary edges point.
 *
 * - `sink` — the rest depends on it; it depends on little. Lifts out as a
 *   DEPENDENCY: other instances declare they need it.
 * - `source` — it depends on the rest; nothing depends on it. Lifts out as a
 *   DEPENDENT: it declares what it needs. Equally separable, opposite
 *   declaration direction.
 * - `tangled` — arrows both ways in comparable numbers. This is the one that
 *   is not separable without real work, and the only one the word
 *   "entangled" should be used for.
 * - `isolated` — no boundary edges at all. Trivially separable, and NOT the
 *   same as tangled however similar the bare `oneWayness` of 0.0 looks.
 * - `undetermined` — the boundary is made of `recorded` edges, whose direction
 *   is a filing decision rather than a fact, so no role can be read off it.
 *   This is the three-state rule the rest of this repository already runs on:
 *   "could not determine" is a distinct answer from "determined to be a
 *   source", and collapsing them is how a wrong partition looks like a clean
 *   one. Under the first cut of this module `processes` and
 *   `scenarios` were both confidently `source` on 100% recorded edges.
 */
export type BoundaryRole = "sink" | "source" | "tangled" | "isolated" | "undetermined";

/**
 * Whether an edge's DIRECTION is a fact or a filing decision.
 *
 * The owner, 2026-09-20, in four words: *"are arrows in wrong direction
 * somewhere?"* Measured the same hour: **470 of 498 cross-group edges — 94% —
 * are `recorded`.**
 *
 * - `enforced` — reverse it and something breaks. A TypeScript `import`, a
 *   BPMN `calledElement`. The direction is a property of the system.
 * - `recorded` — the direction is WHERE THE AUTHOR PUT THE POINTER.
 *   `<folio:skill ref="S">` is written on the diagram, so the arrow runs
 *   diagram → skill. Had the repository put `workflows: [...]` in each skill's
 *   front matter instead, the identical coupling would be stored the other way
 *   and `processes` would measure as a sink rather than a source.
 *
 * The test that settles it is **what breaks each way**. Delete a skill and
 * `roles.json` has a dangling ref; delete `roles.json` and every skill still
 * works but no lane can reach one. Both break — so the coupling is SYMMETRIC
 * and merely written down once, on one side.
 *
 * A third level sits below both. A `prose` edge is a MENTION — one skill naming
 * another in running text, with no link and no declaration. The owner,
 * 2026-09-20: *"if prose is issue, means maybe prose is in wrong place. some
 * needs to be moved (e.g. no forward referencing examples?)."* So a prose
 * mention is not evidence of dependency at all; it is evidence that a sentence
 * may be sitting in the wrong file. Measured here: **315 prose-only cross-group
 * mentions**, 144 out of `folio-core` and 90 out of `folio-paper-adapter`.
 *
 * It is counted and reported, and it enters NEITHER `role` nor the boundary
 * ratios. Letting the weakest evidence move a verdict is how a suspicion
 * becomes a finding.
 *
 * This repository already names the same failure one graph over. `AGENTS.md`:
 * *"Never populate `uses[]` from Lean — it destroys the signal every ordering
 * metric is computed from."* `uses[]` is the editorial relation and the Lean
 * graph is the formal one; they look alike and mean different things, and the
 * rule exists because where a fact is recorded determines what a metric over it
 * means. `bpmn-skill` and `ts-import` are that pair again.
 */
export type EdgeAuthority = "enforced" | "recorded" | "prose";

/** A directed edge. `from` depends on / references `to`. */
export interface DetangleEdge {
  from: string;
  to: string;
  /** How the edge was found, e.g. `md-link`, `bpmn-skill`, `ts-import`. Provenance, so a surprising edge can be re-checked rather than argued with. */
  via: string;
  /** Whether {@link EdgeAuthority the direction} may be trusted. */
  authority: EdgeAuthority;
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

/**
 * The cut kind a DIRECTION verdict supports — and only that.
 *
 * `wrong-direction` is mechanical: the edge leaves a layer for one its
 * declared `needs` does not reach, and `layer-direction.ts` decides it for
 * `check:partition` too, so the two tools cannot disagree about one edge
 * (bean `j79e`). Everything else stays `unclassified` with the verdict as
 * its basis. `restatement` and `essential` are judgements about what the
 * target MEANS, and this package's rule is that the carve is an
 * adjudication — a function that guessed them would turn a reason to look
 * into a finding.
 */
export function classifyByDirection(e: DetangleEdge, d: DirectionVerdict): ClassifiedEdge {
  return { ...e, kind: d.verdict === "wrong-direction" ? "wrong-direction" : "unclassified", basis: d.basis };
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
  /**
   * How one-way the boundary is, REGARDLESS of which way it points:
   * `|2 * oneWayness - 1|`. 1.0 is perfectly one-way, 0.0 is perfectly balanced.
   *
   * This is the correction of a real defect. The owner's clause is *"arrows
   * mostly one way"*, and `oneWayness` alone scores `0.0` both for a group with
   * fifty edges each way (genuinely tangled) and for one with zero in and 334
   * out (perfectly one-way, pointing outward). Measured 2026-09-20,
   * `processes` scored 0.00 on `oneWayness` while being the single most
   * one-way group in the repository.
   */
  directionality: number;
  /** Which way the arrows point. See {@link BoundaryRole}. */
  role: BoundaryRole;
  /** Boundary edges whose direction is a fact. `role` is read off these ALONE. */
  enforcedBoundary: number;
  /**
   * Boundary edges whose direction is a filing decision. Reported as SYMMETRIC
   * COUPLING — a real finding about how tied together two groups are — never as
   * directed dependency.
   */
  recordedBoundary: number;
  /**
   * Cross-group PROSE MENTIONS. Not a dependency and not a coupling: a count of
   * sentences that name something living elsewhere. High means "look at whether
   * this prose is in the right file", not "this group is entangled".
   */
  proseMentions: number;
  /** Distinct nodes outside the group that are referenced. The DEPENDENCY count, as against the reference count. */
  distinctTargets: number;
  /** Distinct groups outside that are referenced. What a declared dependency list would actually hold. */
  distinctTargetGroups: number;
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
  /** Every boundary edge, either direction — needed to weigh enforced against recorded. */
  const boundary: DetangleEdge[] = [];
  let prose = 0;
  for (const e of edges) {
    // An edge to a node we do not know about is not an edge out of the group —
    // it is an unresolved reference, and counting it as outbound would make
    // every group with a broken link look tangled. It is reported by the
    // scanner as a dangling reference instead, which is a different finding.
    if (!known.has(e.from) || !known.has(e.to)) continue;
    if (e.authority === "prose") {
      // Counted, never weighed. See EdgeAuthority: the weakest evidence in the
      // graph must not be able to move a verdict.
      if (inGroup.has(e.from) && !inGroup.has(e.to)) prose += 1;
      continue;
    }
    const f = inGroup.has(e.from);
    const t = inGroup.has(e.to);
    if (f && t) internal += 1;
    else if (!f && t) { inbound += 1; boundary.push(e); }
    else if (f && !t) { worklist.push(e); boundary.push(e); }
  }
  const outbound = worklist.length;
  const total = internal + inbound + outbound;
  const oneWayness = inbound + outbound === 0 ? 0 : inbound / (inbound + outbound);
  // The role is read off ENFORCED edges only. A boundary made of recorded ones
  // is undetermined, however lopsided it looks: the lopsidedness is then a fact
  // about where pointers are filed, not about which side depends on the other.
  const enforcedBoundary = boundary.filter((e) => e.authority === "enforced").length;
  const recordedBoundary = boundary.length - enforcedBoundary;
  const eIn = boundary.filter((e) => e.authority === "enforced" && !inGroup.has(e.from)).length;
  const eRatio = enforcedBoundary === 0 ? 0 : eIn / enforcedBoundary;
  const role: BoundaryRole =
    inbound + outbound === 0 ? "isolated"
    : enforcedBoundary === 0 ? "undetermined"
    : eRatio >= 0.8 ? "sink"
    : eRatio <= 0.2 ? "source"
    : "tangled";
  const targets = new Set(worklist.map((e) => e.to));
  const targetGroups = new Set(worklist.map((e) => known.get(e.to)!));
  return {
    group,
    size: inGroup.size,
    internal,
    inbound,
    outbound,
    // Measured against the boundary only. Dividing by `total` made cohesion and
    // one-wayness both dominated by `outbound`, so a source-like group failed
    // two clauses for ONE underlying reason and read as twice as bad as it was.
    // `processes` has 41 internal edges among 41 diagrams — a well
    // connected family — and scored 0.11 because 334 outward references swamped
    // them.
    cohesion: total === 0 ? 0 : internal / total,
    oneWayness,
    directionality: inbound + outbound === 0 ? 1 : Math.abs(2 * oneWayness - 1),
    role,
    enforcedBoundary,
    recordedBoundary,
    proseMentions: prose,
    distinctTargets: targets.size,
    distinctTargetGroups: targetGroups.size,
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
  /** "arrows mostly one way" — the owner's clause, as a number, and DIRECTION-BLIND. */
  minDirectionality: 0.8,
  /**
   * "maybe some light detangling" — counted in DISTINCT groups referenced, not
   * in raw references. 334 references from `processes` resolve to 57
   * files in 6 packages; the thing a declared dependency list would hold is
   * SIX. Counting multiplicity made one dependency stated 36 times
   * (`document-intake.md`, from the ingestion diagrams) look like 36 problems.
   */
  maxTargetGroups: 3,
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
  if (m.role === "undetermined")
    out.push(
      `role undetermined — all ${m.recordedBoundary} boundary edges are RECORDED, so their direction is ` +
        `where the author filed the pointer, not which side depends on the other. ${m.inbound} in / ` +
        `${m.outbound} out describes the filing, not the coupling.`,
    );
  else if (m.directionality < t.minDirectionality)
    out.push(
      `directionality ${m.directionality.toFixed(2)} < ${t.minDirectionality} — arrows run both ways in ` +
        `comparable numbers (${m.inbound} in, ${m.outbound} out), so it is genuinely TANGLED. This is the ` +
        `only clause for which the word is warranted.`,
    );
  if (m.distinctTargetGroups > t.maxTargetGroups)
    out.push(
      `references ${m.distinctTargetGroups} groups outside itself > ${t.maxTargetGroups} — more than ` +
        `"light detangling" (${m.outbound} raw references to ${m.distinctTargets} distinct nodes)`,
    );
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
  criterion: "size" | "cohesion" | "directionality" | "reach";
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
    : d.startsWith("directionality") ? "directionality"
    : "reach";
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
