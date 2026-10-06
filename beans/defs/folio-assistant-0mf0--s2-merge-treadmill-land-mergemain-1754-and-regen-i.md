---
# folio-assistant-0mf0
title: 'S2 merge treadmill: land merge:main (#1754) and regen-in-CI on the merge result (d33q part B)'
status: completed
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
- [x] median PR-green -> merged measured before and after  — measured 2026-10-06: green→merged median 2.2→5.7 min (not faster); merged-while-red 32 %→3 %

_2026-10-01T17:25:48Z_ — Claimed by claude/s2-regen-in-ci — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-06 — S2 bookkeeping (claude/sep-bookkeeping-s1-s3)

**Holder.** The last claim on record, claude/s2-regen-in-ci, belonged to PR #1820, which merged 2026-10-01T20:15:01Z. That claim is landed work, not mid-flight, so this session holds the bean now (dispatch, owner ruling 2026-10-06: "do all the bookkeeping 1-3").

Two boxes ticked, each re-derived from GitHub on 2026-10-06:
- **#1754 merged** 2026-10-01T17:24:57Z (merged_by litlfred).
- **d33q part B** is `.github/workflows/merge-main.yml`, from #1820 (merged 2026-10-01T20:15:01Z) and #1834 (merged 2026-10-02T07:55:37Z: fire on conflicted PRs, run main's tool). It runs `merge:main`, which ends in `regen` and pushes only a proved result, on a runner and on every push to main. Its recent `push` runs on main (#797, #800, #794, #793) concluded **success**.

**Still open: the third box,** median PR-green → merged, before and after. Nothing in the store measures it. It is NOT the same work as `xpcu` / `f017` / `v3nf`, which measure regen and gates wall-clock, not queue latency, so it is not folded there. Put to the owner on the bookkeeping PR.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3. With no answer from the owner, the stated default ("measure it now") was taken.

### Box 3: PR green → merged, before and after merge-main.yml (#1820, merged 2026-10-01T20:15:01Z)

Read-only GitHub REST data: every PR merged into main in each window, excluding dependabot and `beans(` claim PRs. Gating checks are the check runs named `(hard)`, `TypeScript — bun test*` or `End-to-end*`, taking the latest run of each on the head commit. `green_at` is the latest completion among them when all of them succeeded or were skipped.

| | BEFORE 09-26 → 10-01T20:15Z | AFTER 10-02 → 10-06T19:00Z |
|---|---|---|
| PRs | 324 | 360 |
| green at merge | 188 (58 %) | 339 (94 %) |
| merged before green | 32 (10 %) | 10 (3 %) |
| **merged while red** | **104 (32 %)** | **11 (3 %)** (6 red, 5 with no gating runs) |
| green → merged, median / p75 / p90 (min) | 2.2 / 9.4 / 38.8 | 5.7 / 21.7 / 92.6 |
| created → merged, median (min) | 44.8 | 105.6 |

**What it says.** The change is **not** faster merging. The green → merged median did not shorten, and a 25-PR sample per window points the other way (7.8 → 3.8 min), so the direction is noise. The change is **merging on green**: the share of PRs merged while red fell from 32 % to 3 %. Most before-window reds were in "TypeScript — tests, lint, types (hard)" (96) and "Repository gates (hard)" (65). Median PR age at merge rose from 45 to 106 min, which is the price of waiting for green. The higher after-window percentiles are partly a selection effect: before, the slow PRs were often merged red and so fell outside the green group.

**Limits.**
- Only the head commit is considered.
- Owner hand-merges and guard merges are mixed together.
- The gating check set changed between windows (bun test was sharded later).
- PRs opened before #1820 but merged after it fall in the after window.

Measured 2026-10-06 by a read-only sub-agent. Two of its merge timestamps (#1758, #1824) were spot-checked against the GitHub API in this session.
