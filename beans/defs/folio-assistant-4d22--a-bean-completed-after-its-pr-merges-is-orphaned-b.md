---
# folio-assistant-4d22
title: A bean completed AFTER its PR merges is orphaned by the next re-branch — twice in one session
status: todo
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

- [ ] the orphan is impossible, or is reported rather than silent
