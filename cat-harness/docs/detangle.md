---
layout: default
title: Detangle
nav_order: 42
lang: en
---

# detangle

> **Folded into cat-harness 2026-09-23** (bean `byql`). This was the README of
> a top-level `detangle/` instance that declared no `needs`, so its own edges
> could not be placed by the direction classifier it hosts. The owner's ruling:
> fold it into the harness. The script is
> `skills/graph-management/kg-detangle.ts`, beside the
> [`graph-detanglement`](../skills/graph-management/graph-detanglement.md) skill
> it implements (owner, 2026-09-24); the criterion `schemas/detangle.ts`; the
> pinned measurements `test/results/detangle/`, under the declared `qa`
> directory. Run it with `bun run kg:detangle`.


**Is this candidate subgraph really a subgraph?**

The criterion is the owner's, 2026-09-20:

> candidate subgraph = large collection of thematically related content that is
> disconnected (maybe some light detangling) from other parts of the KG
>
> other parts of graph are only referencing it… **arrows mostly one way**

That second line is what makes it checkable, and it is **not** "a small cut". A
candidate is a near-**sink**: the rest of the graph depends on it, and it
depends on almost nothing outside itself. Ten edges in and ten out is a cut of
twenty and cannot be lifted; fifty in and zero out is a cut of fifty and lifts
cleanly.

## Nothing here decides anything

> taste matters as judgement = human/agentic adjudication

The scanner is a **mechanical reviewer**. It emits findings with a `script`
reviewer and a `severity`, in the shape `schemas/qa-review.ts` already defines,
and it has no opinion about whether to carve. The carve is a `Decision` by a
human or agentic adjudicator, and it may overrule any finding here — a theme a
scanner cannot see is a real reason, and so is a boundary somebody intends to
enforce before the edges exist to prove it.

What the numbers buy is not authority. It is that the adjudication becomes
**reviewable**: *"carved anyway, cohesion 0.31, because X"* is a durable claim
somebody can disagree with later, and *"it felt right"* is not.

## Running it

```sh
bun run kg:detangle
bun run kg:detangle --group cat-harness/processes
bun run kg:detangle --json
```

## Four roles, because "one way" does not mean "inward"

`oneWayness` (inbound share) scores **0.0** both for a group with fifty edges
each way — genuinely tangled — and for one with **zero in and 334 out**, which
is as one-way as a boundary can be. The owner's clause is *"arrows mostly one
way"*, so the measure must be direction-blind:

```
directionality = |2 · oneWayness − 1|
```

| role | arrows | how it separates |
|---|---|---|
| **sink** | in ≫ out | lifts out as a **dependency** — others declare they need it |
| **source** | out ≫ in | lifts out as a **dependent** — it declares what it needs |
| **tangled** | both, comparably | not separable without real work. The only role the word fits. |
| **isolated** | none | trivially separable, and *not* the same as tangled however alike a bare `oneWayness` of 0.0 looks |

## Arrows: is the direction even a fact?

Asked in four words, 2026-09-20: *"are arrows in wrong direction somewhere?"*
Measured the same hour:

| extractor | cross-group edges | direction is |
|---|---|---|
| `bpmn-skill` | 340 | **recorded** |
| `json-skill` | 125 | **recorded** |
| `ts-import` | 28 | enforced |
| `md-link` | 5 | **recorded** |

**470 of 498 — 94% — are `recorded`.**

- **`enforced`** — reverse it and something breaks. A TypeScript `import`, a
  BPMN `calledElement`. The direction is a property of the system.
- **`recorded`** — the direction is *where the author put the pointer*.
  `<bootstrap.processes:skill ref="S">` is written on the diagram, so the arrow runs
  diagram → skill. Had the repo put `workflows: [...]` in each skill's front
  matter instead, the identical coupling would be stored the other way and
  `processes` would measure as a **sink**.

The test that settles it is **what breaks each way**. Delete a skill and
`roles.json` has a dangling ref; delete `roles.json` and every skill still works
but no lane can reach one. Both break — the coupling is **symmetric** and merely
written down once, on one side.

So `role` is now read off **enforced edges alone**, and a boundary made only of
recorded ones is `undetermined`. Ten of twenty-two groups are, including both
groups whose carve was under discussion. The first cut called them `source`
with total confidence on 100% recorded evidence.

This repository already names the same failure one graph over. `AGENTS.md`:
*"Never populate `uses[]` from Lean — it destroys the signal every ordering
metric is computed from."* `uses[]` is the editorial relation, the Lean graph is
the formal one; they look alike, mean different things, and the rule exists
because **where a fact is recorded determines what a metric over it means**.

## What the graph actually looks like

Measured 2026-09-20, 443 nodes and 758 edges:

| group | size | in | out | groups | dir | role |
|---|---|---|---|---|---|---|
| `skills/folio-core` | 108 | **254** | 10 | 3 | 0.92 | sink |
| `skills/content-lifecycle` | 10 | 88 | 1 | 1 | 0.98 | sink |
| `skills/authoring-who-smart-guidelines` | 11 | 60 | 0 | 0 | 1.00 | sink |
| `cat-harness/schemas` | 132 | 5 | 1 | 1 | 0.67 | sink |
| `processes` | 41 | **0** | **334** | 6 | 1.00 | **source** |
| `scenarios` | 1 | 0 | 122 | 6 | 1.00 | source |
| `skills/memory` | 37 | 0 | 0 | 0 | 1.00 | isolated |
| `skills/folio-paper-adapter` | 66 | 47 | 16 | 2 | **0.49** | **tangled** |

**Two tangled groups out of twenty-two.** This is a well-layered graph, and the
layering is the one the architecture describes: skill packages are leaves,
orchestration (`workflows`, `roles`, `tools`) is the root. Only
`folio-paper-adapter` and `bootstrap/skills` are genuinely entangled.

## Reach is counted in groups, not references

334 raw references out of `processes` resolve to **57 distinct files in
6 packages**. `document-intake.md` alone accounts for 36 of them, from the
ingestion diagrams. That is **one dependency stated 36 times**, not 36
problems — so the "light detangling" clause counts distinct target *groups*,
which is what a declared dependency list would actually hold.

## Two defects this found in its own first cut

Both were in the measurement, not the graph, and both are recorded because a
number nobody can re-derive is a number nobody can argue with.

1. **Name collision in resolution.** Five `<bootstrap.processes:skill ref>` values —
   `activity-log`, `getting-started`, `l2-dak-authoring`, `qa-report-signing`,
   `upstream-version-adoption` — are *also* basenames of diagrams in the same
   directory. Preferring a same-group hit resolved every one to the diagram
   referring to it. That manufactured **31 phantom internal edges and all 8
   reported inbound edges** for `processes`. A skill ref names a skill;
   the resolver is now restricted by extension.
2. **Missing call edges.** `<bpmn:import>`, `calledElement` and `decisionRef`
   were not extracted at all — 39 edges, and they are precisely the *internal*
   edges of a workflow graph. Cohesion for the group under discussion was
   understated for the whole time its carve was being argued.

After both fixes `processes` reads **0 in / 334 out**, not 8 / 303. The
conclusion held; the evidence for it did not.

## Known limits, stated rather than discovered later

- **Four extractors only**: `md-link`, `bpmn-skill`, `json-skill`, `ts-import`.
  There is deliberately no full-text extractor — a skill that *mentions* another
  in prose is not depending on it. Under-counting makes a group look cleaner
  than it is, so the extractor list is printed with the results.
- **69 dangling references** at the time of writing. A reference to a node
  outside the scanned set is reported separately and is *not* counted as an
  outbound edge: counting it would make a group with a broken link look
  entangled, which is a different finding calling for a different fix.
- **Only `wrong-direction` is classified mechanically.** `repo-partition.ts`
  asks the same direction question on the module graph, and since bean
  `folio-assistant-j79e` both call one function,
  `cat-harness/schemas/layer-direction.ts`. Here a node's layer is its
  instance, and what it may reach is its declared `needs` plus itself. The
  report's `wdir` column counts wrong-direction outbound edges and `undet`
  counts edges whose source instance declares no `needs` — undetermined, not
  clean. `restatement` and `essential` stay `unclassified`: they are the
  adjudication, and `--group` prints each edge's basis so the adjudicator
  starts from it. The counts are reported, not pinned — the sidecar ruling
  pins size, cohesion and authority counts only.

## For agents working on detangle

This section was the instance's `AGENTS.md`, moved here unchanged when the instance was folded.

### The scanner decides nothing, and neither do you from its output

It emits **findings** with a `script` reviewer and a severity. The carve is a
`Decision` by a human or agentic adjudicator, and that adjudicator **may
overrule any finding here** — a theme a scanner cannot see is a real reason,
and so is a boundary somebody intends to enforce before the edges exist to
prove it.

So: do not carve a subgraph because the numbers look good, and do not argue
that a carve is wrong because they look bad. **What the numbers buy is not
authority — it is that the adjudication becomes reviewable.** *"Carved anyway,
cohesion 0.31, because X"* is a durable claim; *"carved"* is not.

### The criterion is a near-SINK, not a small cut

> arrows mostly one way

Ten edges in and ten out is a cut of twenty and cannot be lifted. Fifty in and
zero out is a cut of fifty and lifts cleanly. **The direction is the test, and
the size of the cut is not** — an agent optimising for a small cut is
answering a different question from the one asked.

Before you treat a direction as a fact, check whether it is a **filing
decision**: an edge that points one way because somebody chose where to put a
file is not evidence about the graph's shape.
