---
# folio-assistant-4d22
title: A bean completed AFTER its PR merges is orphaned by the next re-branch — twice in one session
status: completed
type: bug
parent: folio-assistant-ahvw
created_at: 2026-09-22T11:49:49Z
updated_at: 2026-09-22T11:49:49Z
---

Measured 2026-09-22, twice, on this branch.

## The shape

The sequence that loses it:

1. PR merges.
2. Agent marks the bean `completed` and commits it to the branch.
3. Agent re-branches from the merged main: `git checkout -B <branch> origin/main`.
4. **The completion commit is now orphaned** — it was pushed to the remote
   branch but never merged, and the local branch no longer contains it.

The bean reads `todo` on main, so `beans list --ready` offers it again. Both
times it was caught only because the next session's ready-list showed a bean
that had visibly been finished.

Victims so far: `ebvl` (recovered by merging the remote branch) and `7ofc`
(same, one session later).

## Why it is not carelessness

The completion CANNOT ride its own PR: the bean is not `completed` until the
PR merges, and once it has merged there is no longer a PR to carry the
commit. So the natural order produces an orphan every time, and the agent
doing it correctly is the one who gets bitten.

## What would fix it, unranked — this bean does not decide

- complete the bean in the PR's own last commit, accepting that `completed`
  is asserted a few minutes before it is true
- keep a long-lived branch rather than re-branching from main each round
- a check that no bean is `completed` on a remote branch while `todo` on main
- nothing, and rely on the ready-list catching it

## Done when

- [x] the orphan is impossible, or is reported rather than silent

---

## Summary of Changes — 2026-09-23

Owner's pick: **"close in PR"**, which is the first of the fixes listed above, made the rule. The third one comes along as a report.

- **The rule**: `skills/folio-core/bean-coordination.md` §"Complete it in the
  PR's own last commit". Complete the bean in the last commit of the PR that
  does its work, with the Done-when ticked and its evidence. A bean not yet
  done stays open with a note. Practised for eight beans on 2026-09-23 with no
  orphan.
- **The report**: `bun run beans:landed` (`cat-harness/scripts/beans-landed.ts`)
  lists open, non-epic beans named in a merged PR's title on `main`:
  `done-ticked` first, then `partly-ticked`, then `no-checklist`. It says
  "could not determine" when no merge history is visible, rather than
  reporting clean. It closes nothing. 6 tests.
- **Measured on first run** (30 days, 369 merges): 1 done-ticked (`ajx9`,
  another session's), 23 partly-ticked, 7 no-checklist.
- **One of its findings was this session's own**: `byql` (#1123) was left
  `in-progress` with two boxes unticked. It was re-derived and closed in the
  same PR.

So the orphan is not impossible, but it is now **reported rather than silent**.
