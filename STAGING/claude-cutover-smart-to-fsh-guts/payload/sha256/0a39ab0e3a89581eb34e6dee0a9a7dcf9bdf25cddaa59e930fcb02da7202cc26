---
# folio-assistant-ga6u
title: 'S3 drain in-flight PRs: #1756, #1747, #1753, #1581, #1735'
status: completed
type: task
priority: normal
created_at: 2026-10-01T08:14:33Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

## Done when
- [x] #1756 merged (fnx4 slices 5+6)  — merged 2026-10-02T23:12:43Z, merge commit
  `edc167d24a`. Its head carried 20 check runs: 14 success, 6 skipped, **0 failure**.
- [x] #1747 merged (cmsl step 3)  — closed as superseded 2026-10-01T12:17:13Z (owner decision on the PR); its content landed via #1769 (merged 2026-10-01T12:17:11Z), the remainder went to cmsl (completed)
- [x] #1753 merged (i2kp)  — merged 2026-10-01T19:34:35Z, merge commit `b5f83541a4`.
  Its head carried 16 check runs, one of them a FAILURE: `cleanup`, which is
  housekeeping rather than a gate (every gate here is suffixed `(hard)` or
  `(warn-only)`, and `cleanup` is skipped on most runs). This box asks only
  whether it merged, and it did; the red `cleanup` is recorded so nobody has to
  re-derive it.
- [x] #1581 closed as superseded or rebased  — merged 2026-10-04T13:13:30Z
- [x] #1735 owner ruling on dependents -> subgraph:true, then merged  — merged 2026-10-03T19:18:28Z; qsx4 completed


## 2026-10-01 late — #1735 / qsx4

Owner ruling (earlier, recorded on #1735, 16:26Z) re-affirmed: **the outdated `dependents` prose in the who-iris files is reworded NOW**, in #1735's merge — who-iris.json's `_dependents_comment` on who-iris-themes, the who-iris-docs `_comment`, and the `qa` description — each describing the current mechanism (the graph kind's `perInstance` and nested subgraphs declared with `"subgraph": true`). The same stale wording in the ~15 other declarations stays out of scope there. Consistent with the Q-B ruling (Q1: REWORD) on `zhg2`.

Bean `qsx4` exists only on #1735's branch, so this is recorded here and on the PR rather than by creating its file on main (an add/add conflict for #1735).

_2026-10-06T19:03:20Z_ — Claimed by claude/sep-bookkeeping-s1-s3 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n S1–S3 bookkeeping). Every PR this bean drains is closed; each was re-read from GitHub on 2026-10-06, not taken from an earlier note.

| PR | outcome | where its work went |
|---|---|---|
| #1756 | merged 2026-10-02T23:12:43Z | ticked earlier, unchanged |
| #1753 | merged 2026-10-01T19:34:35Z | ticked earlier, unchanged |
| #1747 | **closed unmerged** 2026-10-01T12:17:13Z, superseded | Owner decision recorded on the PR (2026-10-01T09:12Z): "close this PR once #1769 merges". #1769 merged 2026-10-01T12:17:11Z and restored step 3's data (PR0 0a). #1785 (merged 2026-10-01T13:18:31Z) added the guard against re-mirroring. The leftover items moved to bean `cmsl`, which is now `completed`. |
| #1581 | merged 2026-10-04T13:13:30Z (merge df31bb26a) | plan-only PR (bean r0tm); the box asked for closed-or-rebased, and it merged |
| #1735 | merged 2026-10-03T19:18:28Z (merge 9a3c293f6) | owner's dependents ruling recorded on the PR before merge; bean `qsx4` is `completed` |

The #1747 box is ticked as satisfied by its supersession, not by a merge. The box said "merged", but the owner chose to close it, and its content landed through #1769.
