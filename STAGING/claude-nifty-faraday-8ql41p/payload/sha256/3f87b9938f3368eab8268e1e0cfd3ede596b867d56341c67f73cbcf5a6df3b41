---
# folio-assistant-hfag
title: 'Merge pipeline: train process, queue state, reprioritisation, gates'
status: in-progress
type: epic
priority: high
created_at: 2026-10-02T17:17:27Z
updated_at: 2026-10-02T18:52:43Z
blocking:
    - folio-assistant-7x5n
---

Owner, 2026-10-02: the merge pipeline gets its own top-level epic, marked as blocking the separation epic `7x5n`. Running the queue is NOT part of this epic; this epic is the finite build list below.

Until now the steward's ordering lived in prose (#1802's merge-manager SOP step 2, "oldest first, unless the owner names an order"), so nothing recorded WHY one PR jumped ahead of another, and a second steward session could not see the first one's decisions.

## The rule this epic exists to hold

The queue stores DECISIONS only. Facts GitHub owns (CI status, mergeability, labels, head SHA) are read live at render/decision time and never stored. A stored fact is a second answer to a question GitHub already answers, and it goes stale the moment a push lands.

## Re-parented here

- `d33q`: merge-base.bpmn sub-process (merge:main)
- `dlqu`: CI speed-up 4 (sharding, BPMN cache, shallow checkout)

## To re-parent once their PRs land (not on main yet)

- `nok9`: merge-gate epic, PR #1887
- `zacz`: merge-refusal process, PR #1888
- `u7be`: four merge-steward gaps, PR #1887

Related, not re-parented: `1hjm` (GitHub's merge queue is unavailable on a personal-account repo, which is why this queue is home-grown), `0mf0` (S2 merge treadmill under 7x5n).

## Done when

- [x] `cat-harness/processes/merge-train.bpmn`: calls merge-base per member, gates via code-quality-gates / pr-checks-present, calls merge-refusal on refusal, links graph-detanglement, kg-separation and feature-staging; lanes merge steward / sibling session / build pipeline / owner  — landed at `processes/sdlc/merge-train.bpmn`; the `sdlc/` segment is the #1875 process regroup, not a different file
- [x] role `merge-steward` in `cat-harness/scenarios/roles.json`, with its skills
- [ ] train runs recorded as workflow instances under `beans/workflows/` (existing store and schema)
- [ ] queue schema `cat-harness/schemas/merge-queue.ts` (zod), declared as a `state` graph; an override with no reason is rejected
- [x] reprioritisation DMN under `cat-harness/processes/decisions/`, with a unit test that reproduces the 2026-10-02 order  — at `processes/sdlc/decisions/merge-priority.dmn`; `merge-queue.test.ts` asserts the order rather than assuming it
- [ ] a harness tile showing the queue (decisions joined with live GitHub facts at render time)
- [x] skill `merge-queue`, registered with `skill:register`
- [x] gates, render:bpmn:check and kg:audit:check green on the PR  — CI green at `92cb9ae7`: 12 check runs, 11 distinct, 0 not-green, 0 not-completed



## Related epic: nok9 (merge gate), 2026-10-02

The merge-gate epic `nok9` (#1887, on main since train 4 / #1893) is the gate set this epic's `merge-train.bpmn` runs at `Call_Gates`. Re-parenting it under `hfag` was attempted and refused by `beans`: an epic may have only a milestone as parent. Left as a sibling until someone decides between retyping `nok9` to a feature or introducing a milestone over both.


## Status at the forward-merge, 2026-10-03

The epic's work was **finished and green but stranded**: `main` moved under it while
its authoring session (`01ToWZR4`) ended, leaving 114 conflicts. 113 were generated
families; the 114th was a real two-sided edit on `dlqu`, reconciled to keep both the
owner's `hfag` re-parent and main's claim. One `bun run regen` — 80 current, 15
regenerated, **0 unrepaired**, 0 without a writer.

**Landed on the owner's instruction ("do hfag next", then: land it as-is).** The epic
stays open, because three of its deliverables genuinely are not done, and an epic bean
carrying honest open boxes is what makes the plan readable:

| still open | measured |
|---|---|
| train runs as workflow instances | `beans/workflows/` holds instances, but every one is `code-change-review--*`; no train has been recorded |
| `merge-queue.ts` declared as a `state` graph | the schema exists; the DECLARATION does not — `merge-queue` appears in neither `cat-harness.json` nor the graph-kind registry. This box is **partial**, which is why it is not ticked |
| a harness tile showing the queue | no merge-queue tile in `harness-tiles.ts` or `tiles.json` |

The PR body's own checklist was stale in **both** directions — it showed finished work
as open, and omitted that these three were not done. The bean is the authority; it has
now been reconciled against the branch rather than against that body.
