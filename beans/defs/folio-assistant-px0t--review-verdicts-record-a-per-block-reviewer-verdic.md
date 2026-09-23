---
# folio-assistant-px0t
title: 'REVIEW VERDICTS: record a per-block reviewer verdict so GW_Covered''s uncoveredBlocks is computed, not supplied'
status: todo
type: task
created_at: 2026-09-23T11:41:17Z
updated_at: 2026-09-23T11:41:17Z
parent: folio-assistant-q4jm
---

Found while doing en2d (2026-09-23). `content-change-review.bpmn` now has a
coverage gate, `GW_Covered`, backed by `decisions/review-coverage-gate.dmn`.
It reads two facts: `uncoveredBlocks` and `openDefects`.

`openDefects` can already be counted from `review-comments.json`.
**`uncoveredBlocks` cannot**, because nothing records a reviewer's per-block
VERDICT. A verdict means "I read this block, and here is my judgement". It is
not the same as "all its comments are resolved". Until verdicts exist:
- the caller has to supply the count by hand;
- the heat map's "Review coverage" column still says "not measured yet";
- the review page has no "next unreviewed" key.

## Done when
- [ ] a verdict record exists: block label, block hash, reviewer, role, verdict, and a waiver reason when the verdict is a waiver. It is committed to the feature branch, as review-comment status is (owner ruling: "commit to feature branch").
- [ ] a Tool computes `uncoveredBlocks` from the ChangeSet plus the verdicts. A verdict on an older block hash does not count.
- [ ] the heat map's coverage column is measured from it
- [ ] the review page gets "next unreviewed"
