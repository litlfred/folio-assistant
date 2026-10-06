---
# folio-assistant-z7n1
title: qa:resolve-conflicts staged with a plain git add, so a branch that gitignores its results directory aborted merge:main
status: in-progress
type: bug
parent: folio-assistant-d33q
created_at: 2026-10-03T17:55:24Z
updated_at: 2026-10-06T23:36:18Z
---

Found 2026-10-03 while measuring why `merge:main`'s last `push` run
(37140844477) was red. Fixed in the same turn; recorded because the *shape* of
the failure is the reusable part.

## What happened

The run's conclusion was `failure`, and 14 of its 15 matrix members had
succeeded. Reading a matrix run's conclusion as a claim about every member is
the same error as reading a filter's output as a claim about its source — only
#1801 failed.

Its step 14, *Fail on anything but a merge, an up-to-date branch or a
refusal*, fired on:

```
merge-base: ABORTED, tree restored — qa:resolve-conflicts left 1 sidecar(s) conflicted
```

#1801 is *Arc 3fva phase 3: QA readers off committed results*, so its
`.gitignore` adds `cat-harness/test/results/` and nine siblings.
`takeProvisionalSide` ran `git add -- <sidecar>` under that newly ignored
directory and git refused:

```
The following paths are ignored by one of your .gitignore files:
cat-harness/test/results
```

A path unmerged in the index is **tracked** by definition, so an ignore rule
must not decide whether its resolution can be staged. Both `git add` sites now
pass `-f`.

## Measured, not assumed

| | |
|---|---|
| matrix members in run 37140844477 | 15 |
| of those, succeeded | 14 |
| sidecars left conflicted by the resolver | 1 — `cat-harness/test/results/kg-qa/skills/kg/kg-core/directory-conventions.kg-qa.json` |
| `git add` call sites needing `-f` | 2 |
| does the refused `add` merely warn? | **no — it COLLAPSES the unmerged stages** |
| clean re-merge of #1801 with the patch, sidecars left | **0**, exit 0 |

The collapsed-stages row is the one worth keeping. The refused `add` leaves no
stages behind, so the `checkout --<side>` that follows fails with *"is in the
index, but not at stage N"* — the resolver dies somewhere other than where the
cause is. It also broke the first version of the regression test, whose
reproduction step destroyed the state it then asserted on; the test is now two
repositories for that reason.

## Two things this says about reporting, beyond the fix

- **The bot's comment pointed at the one place an agent cannot read.** It said
  "see the run log" and listed the eight patterns it HAD resolved, which reads
  like a resolver that half-worked. `gh` cannot fetch a job log at all — it
  redirects to blob storage — so the cause was reachable only through the MCP
  log tool. PR #2016 (*a failing step says what failed, where a reader can get
  at it*) is the right home for fixing that; this bean is the worked example.
- **An aborting tool that restores the tree is why this cost one run and not a
  branch.** `merge-base.ts`'s `abort()` put #1801's worktree back, so the
  collapsed index never reached anybody.

## Done when

- [x] both `git add` sites in `qa-resolve-conflicts.ts` pass `-f`, with the
      reason at the call site
- [x] a test that the resolution lands under an ignoring `.gitignore`
- [x] a falsification, on its own repository, that the plain `add` collapses
      the stages
- [x] verified end to end on #1801's own head, not only in unit tests
- [ ] #1801's next `merge:main` run goes green (needs this on `main` first —
      `merge-base.ts` runs from main's copy of the tool)

_2026-10-06T23:36:18Z_ — Claimed by claude/z7n1-close-landed-resolver-staged-f — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
