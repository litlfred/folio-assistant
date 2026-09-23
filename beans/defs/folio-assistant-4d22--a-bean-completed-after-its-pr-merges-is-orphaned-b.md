---
# folio-assistant-4d22
title: A bean completed AFTER its PR merges is orphaned by the next re-branch — twice in one session
status: completed
type: bug
priority: normal
created_at: 2026-09-22T11:49:49Z
updated_at: 2026-09-23T21:10:04Z
parent: folio-assistant-ahvw
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

## Summary of Changes

Closed 2026-09-23. The owner chose **"Rule + check"** when this bean was put to them.

- **The rule**, in `bean-coordination` §"Complete the bean in the PR that lands it" (STRICT), and in lifecycle step 4: complete the bean in the PR's own last commit, before the merge.
- **The check**, `bun run check:bean-orphans` (`scripts/check-bean-orphans.ts`). It reads the fetched `origin/claude/*` refs and reports each bean completed on a branch, open on `main`, and completed after `main`'s copy last changed. A branch whose only changes are under `beans/` is flagged as a likely orphan. It reports rather than fails, and exits 2 when no branch was read.

Two false findings from its first real run were fixed, and each is now a test:

- **Keyed by FILE, not id.** `t3n8` is two different beans on `main`.
- **Dates compared.** `5a3l` was reopened on `main` after old branches closed it, so those branches are behind rather than orphaned.

The real run read 339 branches and found 0 likely orphans, and 11 completions inside PR work. One is worth a look: `54rk`, completed on `claude/charming-curie-n04agq`, whose PR #1123 has merged.

Verified: `bean-orphans.test.ts` passes 5/5.
