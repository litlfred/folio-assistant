---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: completed
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T05:47:35Z
parent: folio-assistant-1xhc
---

Measured 2026-09-27 on pristine main `c6960465301`, and the same on 2026-09-26 at `8fb8a041a8e`.

## What happens

A full `bun test` rewrites all 72 files under `cat-harness/content/pipeline/script-sidecars/`, changing only three fields in each:

    last_run_at     wall-clock time of this run
    last_run_sha    the checked-out HEAD
    engine_version  the local bun (bun-1.3.11 here; the committed copies say bun-1.3.14)

Nothing else in the tree changes. The writer is `saveQaScriptSidecar` (`qa-utils.ts`), and its callers are `script-sweep.ts` and `qa-sweep.ts`.

## Why it matters

`bun run gates` has a tree-mutation detector, which is how bean `ymsu` was made visible. It therefore ends *'every gate passed, and the run is NOT clean — 1 gate(s) changed the tree'* with exit 1, on every branch, pristine main included. A signal that is always red is one people stop reading, and then it cannot report the next real in-run repair, which is the `ymsu` failure class this detector exists for. This is the same class as `ymsu` (in-progress, another session's), but a different writer, and `ymsu` does not mention these files.

## Not yet isolated

Run alone, none of these writes the sidecars: `qa-review`, `profile-conformance-axis`, `corpus-gate`, `check-command-paths`, `lean-ref-coverage`, `qa-checker-discovery`, `pipeline-resolution`, `qa-sweep-merge`, `qa-witness`, `qa-tools`, `usage-paths-self-reference`, `publish-block-qa`. The full suite always does. So it is either an untried file or an interaction between files.

## Done when

- [x] the test that triggers the write is named — `init-folio-qa.test.ts`, by bisection (below)
- [x] the volatile fields stop causing writes — `saveQaScriptSidecar` no longer counts `engine_version` as a change (owner chose this over a temp-root override for the test alone)
- [x] `bun run gates` ends clean — 167 of 167, exit 0, no tree mutation (measured on this branch, based on main)

_2026-09-27T05:19:35Z_ — Claimed by claude/sleepy-babbage-ls90iz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## Named, 2026-09-27: `init-folio-qa.test.ts`, and why

Bisection over `cat-harness/scripts/tests/` (432 files, 9 halvings) ends at one file, and that file alone reproduces all 72 rewrites. Its second test, *"swept from the repository root, as CI does, a subfolder folio's verdicts land at ITS root"*, spawns the real `qa-sweep.ts` against a throwaway folio in a temp directory.

The sweep then saves every script sidecar under its **own** `REPO_ROOT` (`qa-sweep.ts` near line 745, `saveQaScriptSidecar(sidecar, REPO_ROOT)`), which is the platform checkout, whatever it swept. The code comment says this is deliberate: those sidecars describe the platform's own checker scripts. So a sweep of **any** folio, including a test fixture, restamps the platform's committed sidecars with the current time, HEAD and bun version.

That is why none of the other candidates wrote them alone: this is the one test that runs a real sweep rather than a helper.


## Summary of Changes

The cause was already half-fixed: `saveQaScriptSidecar` skipped a write when nothing substantive changed. But it counted `engine_version` as substantive, and the committed sidecars carry CI's `bun-1.3.14`, so any run under another bun rewrote all 72. `init-folio-qa.test.ts` performs a real sweep, which is how `bun test` came to do it.

- `engine_version` is dropped from the comparison, together with the two `last_run_*` fields. All three describe the run rather than the checker, and no reader uses a script sidecar's `engine_version` for freshness.
- The test that asserted *"DOES rewrite when the engine version changes"* now asserts the opposite, and its comment says why the reversal was made. A new test checks that a real content change still records the engine it ran under.
- Verified: the sidecar tests pass 9/9; `init-folio-qa.test.ts` now leaves 0 sidecars changed; and `bun run gates` passes 167/167 and ends clean, which it has not done on any branch while this bean was open.
