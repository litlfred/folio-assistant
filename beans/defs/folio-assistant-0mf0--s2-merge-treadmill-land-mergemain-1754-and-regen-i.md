---
# folio-assistant-0mf0
title: 'S2 merge treadmill: land merge:main (#1754) and regen-in-CI on the merge result (d33q part B)'
status: in-progress
type: task
priority: high
created_at: 2026-10-01T08:14:33Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-7x5n
---

G4. Main moves ~every 3 min; a merge->regen->CI cycle is ~22 min; three handovers stalled on it.

## Done when
- [x] #1754 merged  — 2026-10-01T17:24:57Z
- [x] d33q part B: CI regenerates on the merge result  — merge-main.yml (#1820, #1834), green on main
- [ ] median PR-green -> merged measured before and after

_2026-10-01T17:25:48Z_ — Claimed by claude/s2-regen-in-ci — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-06 — S2 bookkeeping (claude/sep-bookkeeping-s1-s3)

**Holder.** The last claim on record, claude/s2-regen-in-ci, belonged to PR #1820, which merged 2026-10-01T20:15:01Z. That claim is landed work, not mid-flight, so this session holds the bean now (dispatch, owner ruling 2026-10-06: "do all the bookkeeping 1-3").

Two boxes ticked, each re-derived from GitHub on 2026-10-06:
- **#1754 merged** 2026-10-01T17:24:57Z (merged_by litlfred).
- **d33q part B** is `.github/workflows/merge-main.yml`, from #1820 (merged 2026-10-01T20:15:01Z) and #1834 (merged 2026-10-02T07:55:37Z: fire on conflicted PRs, run main's tool). It runs `merge:main`, which ends in `regen` and pushes only a proved result, on a runner and on every push to main. Its recent `push` runs on main (#797, #800, #794, #793) concluded **success**.

**Still open: the third box,** median PR-green → merged, before and after. Nothing in the store measures it. It is NOT the same work as `xpcu` / `f017` / `v3nf`, which measure regen and gates wall-clock, not queue latency, so it is not folded there. Put to the owner on the bookkeeping PR.
