---
# folio-assistant-5qq3
title: 'REGEN SCOPE: the browser jobs'' artefacts are outside regen''s fast set, and a stale one only surfaces in CI'
status: completed
type: task
priority: normal
created_at: 2026-09-30T18:53:17Z
updated_at: 2026-10-01T12:50:27Z
parent: folio-assistant-2upx
---

Found 2026-09-30 on PR #1633, by CI rather than by `regen`.

`End-to-end + accessibility (hard)` failed on `render:bpmn:check` with three
stale drawings — `bootstrap/processes/{discussion,initialize-harness,log-message}.svg`
— on a tree where `bun run regen` had just reported a fixed point.

## This is NOT the same defect as `check:X` (the prefix-convention false clean)

Worth separating, because the remedies differ and conflating them would hide
one behind the other.

- The `check:X` defect was a **false clean**: regen offered no verdict at all
  on a gate it should have, and said `0 without a writer` anyway.
- This is a **scope** matter, and regen is HONEST about it. Its own first line
  reads:

  > `regen-after-merge — 73 verify/write pair(s) in the fast gate set (of 191 gate(s))`

  `render:bpmn:check` runs in the e2e job, outside the fast set, so regen
  never claimed to have checked it.

So the misreading was mine: "0 regenerated" over the fast set is not "the tree
is current". But a line a reader has to qualify every time is a line that
will be read unqualified eventually, which is why this is worth a bean rather
than a shrug.

## Options, none chosen here

1. **Widen regen to every gate**, not just the fast set. Honest, and slower:
   the browser writers are the expensive ones.
2. **Report the uncovered set** — regen ends with the count of gates it did
   NOT offer, so the denominator is visible at the point of the verdict.
   Cheapest, and the same shape as `audit:coverage`'s "16 declare @covers
   none".
3. **Leave it**, on the grounds the first line already says "fast gate set".

(2) is the one that matches how this repository states denominators
elsewhere, but it is a change to the line everybody reads, so it is the
owner's.

## Done when

- [x] a reader of regen's last line can tell how much of the gate set it
      covered, without reading the first line back


## 2026-10-01 — two more measured instances (PR #1769)
- render:bpmn: five bootstrap(-tools) SVGs stale after a submodule pin change; regen reported a clean fixed point; CI's E2E job failed at 'rendered BPMN SVGs are current'.
- library:viz: 18 artefacts stale since #1744 added library entries; regen reported clean; the only signal was library-viewer-scope.e2e.ts failing in CI ('fhir-harness declares 3 library entries on disk and the viewer data holds none').

_2026-10-01T12:36:11Z_ — Claimed by claude/fervent-brahmagupta-rbwhzm — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes (2026-10-01, owner chose option 1, PR #1784)
- regen-after-merge.ts: UNGATED_INPUTS — library:viz and schema:viz are run as writers (asked first, so a fast-set check reading their output settles in the same pass) WITHOUT becoming gates; the owner's 2026-09-20 ungating ruling stands.
- The last lines now carry the denominator: 'NOT covered: N verify/write pair(s) outside this run … bun run regen --all asks them too: <names>' (today: render:bpmn:check, bat:sync:check).
- Tests: every UNGATED_INPUTS pair names real scripts; none is a gate (fails the day one becomes one); asked-first settles a dependent in one pass. regen-after-merge.test.ts 23 pass.
- First real run: 80 current, 3 regenerated (schema:viz stale on main, and two checks that read it).
