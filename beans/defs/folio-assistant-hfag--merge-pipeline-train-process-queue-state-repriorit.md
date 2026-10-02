---
# folio-assistant-hfag
title: 'Merge pipeline: train process, queue state, reprioritisation, gates'
status: in-progress
type: epic
priority: high
created_at: 2026-10-02T17:17:27Z
updated_at: 2026-10-02T17:17:27Z
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

- [ ] `cat-harness/processes/merge-train.bpmn`: calls merge-base per member, gates via code-quality-gates / pr-checks-present, calls merge-refusal on refusal, links graph-detanglement, kg-separation and feature-staging; lanes merge steward / sibling session / build pipeline / owner
- [ ] role `merge-steward` in `cat-harness/scenarios/roles.json`, with its skills
- [ ] train runs recorded as workflow instances under `beans/workflows/` (existing store and schema)
- [ ] queue schema `cat-harness/schemas/merge-queue.ts` (zod), declared as a `state` graph; an override with no reason is rejected
- [ ] reprioritisation DMN under `cat-harness/processes/decisions/`, with a unit test that reproduces the 2026-10-02 order
- [ ] a harness tile showing the queue (decisions joined with live GitHub facts at render time)
- [ ] skill `merge-queue`, registered with `skill:register`
- [ ] gates, render:bpmn:check and kg:audit:check green on the PR
