---
# folio-assistant-0ris
title: 'STANDALONE GATE RED: #1955''s foreign-checkout filter hides every sibling layer from instanceRootsIn'
status: in-progress
type: bug
priority: critical
created_at: 2026-10-05T06:09:40Z
updated_at: 2026-10-05T06:10:08Z
parent: folio-assistant-iirv
---

## What

`check:cat-harness-standalone` has been red on every PR since #1955 merged (e49c0862). CI on PR #2142 (job 111629516974, 2026-10-05) found **85** tests that fail standalone and that the baseline does not list. This blocks the "Repository gates (hard)" job on every open PR. main's own run did not show it, because main failed at an earlier step on stale subgraph JSON-LD.

## Root cause (measured)

#1955 (bean `g43f`) added `.filter((p) => !isForeignCheckout(p, submodules))` to `instanceRootsIn` in `cat-harness/schemas/cat-harness.ts`. The aim was to stop `.claude/worktrees/` siblings from reading as instances. The rule says a nested checkout is not part of the enclosing tree unless it is a declared submodule, so it assumes there is an enclosing repository.

`probeStandalone` has no such repository. It runs `git init` on each closure layer separately, inside a plain temp directory with no `.gitmodules`. The filter therefore dropped **every** sibling layer, and every reader running standalone found no instance beside cat-harness. #1955 merged one merge after #1977 measured the baseline, so neither PR's CI could see the problem.

Evidence comes from a scratch rehearsal that copies `probeStandalone`'s layout and runs only `scripts/tests/voices-viz.test.ts`:

- At 98ab8cd784 (#1977), 3 tests fail, and all 3 are in the baseline.
- At e49c086207 (#1955), 6 tests fail. Two of them are among the three that CI listed as new. The third CI-listed test fails on main.
- At e49c086207 with ONLY the `instanceRootsIn` filter reverted, 3 tests fail, the same 3 as at #1977.

This **refutes** the suspected cause, the `readVoicesGraph` change from `repoRootFor` to `siblingScopeFor`. For a nested instance, both functions return the same directory.

## Fix

- `instanceRootsIn` now applies the foreign-checkout filter only when the scanned directory lies inside a checkout, meaning the directory or one of its ancestors holds `.git`.
- The `g43f` worktree-escape tests still pass.
- A new test pins the peer-clone layout. It fails without the fix.
- One #1955 test (`checkoutRootFor ... THIS checkout answers itself`) asserted the monorepo layout only. It now asserts both layouts by the same `.git` marker.
- The baseline only shrinks.

## Done when

- [ ] the PR is merged and `check:cat-harness-standalone` passes on CI

Issue: https://github.com/litlfred/folio-assistant/issues/2159 — branch `claude/zealous-gates-3o9ma2-standalone-fix`.
