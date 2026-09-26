---
# folio-assistant-xm31
title: 'om30 residual masking MEASURED: five gate failures on main that CI has never reported'
status: todo
type: task
created_at: 2026-09-26T14:46:29Z
updated_at: 2026-09-26T14:46:29Z
parent: folio-assistant-1xhc
---

`om30` recorded a KNOWN LIMIT rather than implying it: the gates-job split took
the masked region from 45 steps to 6, not to 0, and "local evidence says all six
pass today" was explicitly a fact about that day's tree rather than a property of
the arrangement.

That fact has expired, and here is the measurement.

## What is masked today, and how it was established

main's `Repository gates` job stops at **`check:glossary`** (step 8 of 43), so
every step after it has not run in CI since `2c295f8ac06` (2026-09-26 13:51).
Five gates fail on `origin/main` right now and NOTHING in CI says so:

| gate | fails on `origin/main` |
|---|---|
| `check:subgraphs` | yes — 6 dangling links |
| `docs:auto:check` | yes — 5 stale `docs-auto` pages |
| `translation:index:check` | yes |
| `check:ci-invocations` | yes |
| `cat-harness/scripts/gen-docs-pages.ts --check` | yes — 5 stale `.md` pages |

**Method, because "it failed in my branch" would prove nothing:** each was run in
a detached worktree checked out at `origin/main` (`f850f721a06`) with only
`node_modules` symlinked at the root. All five FAIL there. None of them is any
open branch's, and none is visible from a CI run.

`check:subgraphs` is `gw8h`/#1413's six doubled hrefs, so one of the five already
has an owner. The other four do not.

## Why this is not the same finding as `om30`

`om30` was about a job whose FIRST failing step was step 2, so 45 steps never
ran. That is fixed. This is the residual: ONE red step still hides everything
behind it, and the step that happens to be red MOVES. Today it is
`check:glossary` at step 8, which masks 35 steps rather than the 6 the merge
commit predicted — because the prediction assumed the red step stays at 42.

**The masked count is not a property of the split; it is a property of WHICH step
is red.** That is the correction `om30`'s "45 -> 6" needs, and it is why the
number cannot be quoted from a commit message.

## What lands with #1405

#1405 regenerates the three kg-skills glossary artefacts, which turns
`check:glossary` green. So merging it UNMASKS the five above: CI will start
reporting failures that have been there and silent. That is the gate working,
not a regression #1405 introduced, and it is stated here in advance so nobody
reads the first red run as its fault.

## Done when

- [ ] the owner has decided whether the remaining steps get `continue-on-error`,
      a second split, or nothing
- [ ] the four unowned failures each have a bean or an owner
