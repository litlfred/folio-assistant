# detangle

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
bun run detangle/scripts/kg-detangle.ts
bun run detangle/scripts/kg-detangle.ts --group cat-harness/skills/workflows
bun run detangle/scripts/kg-detangle.ts --json
```

## The finding that overturned a plan

Measured 2026-09-20 over 443 nodes and 719 edges, **after** four carves had been
agreed and **before** any of them was made:

| group | size | cohesion | in | out | one-way |
|---|---|---|---|---|---|
| `cat-harness/schemas` | 132 | 0.86 | 6 | 1 | **0.86** |
| `cat-harness/skills/folio-core` | 108 | 0.30 | 218 | 10 | 0.96 |
| `cat-harness/skills/workflows` | 41 | 0.09 | 8 | **303** | **0.03** |
| `cat-harness/skills/roles` | 1 | 0.00 | 0 | **122** | 0.00 |
| `cat-harness/skills/memory` | 37 | 0.00 | 0 | 0 | 0.00 |

`workflows` was the carve with the strongest argument behind it — 41 files, and
`bootstrap/harness.json` already declares its own workflows separately. It is
**the worst near-sink in the repository**: 303 arrows out, 8 in. Every activity
carries `<folio:skill ref>`, so the diagrams depend on the skills and the skills
do not depend back.

`roles` is the same shape in miniature — one file, 122 arrows out.

**That does not settle it**, and the direction of the arrows is why. A near-sink
lifts out as a **dependency** (others declare they need it). A near-source lifts
out as a **dependent** (it declares it needs others), and this repository
already supports that: an instance inherits its dependencies' skills through its
`harness.json`. So `workflows` is still carvable — the 303 edges become one
declared dependency rather than 303 problems — but it is a *different kind* of
carve from the one the criterion describes, and calling them the same would hide
which direction the declaration has to run.

`memory` is the case the thresholds score wrongly, and it is recorded rather
than tuned away: 37 nodes, **zero** edges in either direction. It fails
`cohesion` — the entries do not reference each other — while being the most
liftable directory measured. "Disconnected from the rest" and "connected to each
other" are two clauses, and a set can satisfy the first completely while failing
the second. The thresholds are a lens, not a verdict.

## Known limits, stated rather than discovered later

- **Four extractors only**: `md-link`, `bpmn-skill`, `json-skill`, `ts-import`.
  There is deliberately no full-text extractor — a skill that *mentions* another
  in prose is not depending on it. Under-counting makes a group look cleaner
  than it is, so the extractor list is printed with the results.
- **69 dangling references** at the time of writing. A reference to a node
  outside the scanned set is reported separately and is *not* counted as an
  outbound edge: counting it would make a group with a broken link look
  entangled, which is a different finding calling for a different fix.
- **`repo-partition.ts` is the same question on the module graph** and is not
  yet an instance of this. Bean `folio-assistant-j79e`.
