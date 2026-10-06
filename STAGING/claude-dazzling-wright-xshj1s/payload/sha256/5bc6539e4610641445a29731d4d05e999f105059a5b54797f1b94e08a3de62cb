---
# folio-assistant-94zs
title: 'REGEN --changed: ask only the pairs a merge touched, and narrow the fixpoint''s later passes'
status: in-progress
type: task
priority: high
created_at: 2026-10-05T05:12:20Z
updated_at: 2026-10-06T10:47:25Z
parent: folio-assistant-xpcu
---

Owner, 2026-10-05: "maximize efficiency, get regen time as minimal as possible".

## What
1. `bun run regen --changed <base>`: changed paths = `git diff --name-only <base>...HEAD` plus the working tree. Ask only pairs whose declared inputs/outputs (globs) or script import closure intersect them. Undeclared and `{tracked}` pairs always run. `--explain` names each skip. Default stays the full run.
2. Narrow fixpoint: pass N+1 re-asks only pairs whose inputs intersect what pass N actually changed (measured from git status before/after, not declared), plus undeclared pairs. Settled still means a pass that ran no writer.
3. Narrow glob declarations in `task-io.ts` for the slow pairs, each READ first, so (1) skips anything at all: today every declared pair is `{tracked}`.

## Falsifier
A pair whose declared input changed is skipped. Tests must show it never is.

## Done when
- [ ] `--changed` + narrowed fixpoint, with bun tests for each case above
- [ ] merge:main decision recorded with reasons
- [ ] measured full vs `--changed` on one realistic merge, load noted
- [ ] regen docblock + skill regen-mode description updated

Claimed by session https://claude.ai/code/session_01VfkKocGaQW7Msro2t5S66U on branch claude/zealous-gates-3o9ma2 (2026-10-05).

## Progress, 2026-10-05 (PR #2141)

- [x] `--changed <base>` and the narrowed fixpoint, with tests in `cat-harness/scripts/tests/changed-paths.test.ts`
- [x] merge:main passes `--changed <fork point>` (reasons on `regenArgs` in `merge-base.ts`); `--full-regen` opts out
- [x] measured: a replay of merge:main (older main 27b16bcac8 + this code, merging 98ab8cd784 = #1977, 18 changed paths). Full regen took 1601 s and the `--changed` run took 1406 s, both at load 17-19 on 4 CPUs. `--changed` skipped **0 of 114** pairs, so the gap is noise, not this change.
- [x] regen docblock + prepare-merge regen-mode block

**What is still open:** every pair is either undeclared (always asked) or `{tracked}` (asked on any change), so neither cut can skip anything until `task-io.ts` gains narrow, read-first glob declarations. Stream D owns that. The falsifier test covers each new declaration automatically. Wall time is bounded by `kg:audit:all:check` (198 s), `skill:register:check` (107 s, a barrier) and `kg:audit:check` (81 s), measured serially on e49c086207. A next lever for those is a recorded read-set (files opened and directories listed at the last green run), not a hand declaration.


## 2026-10-06

Re-read, nothing new built. Every box was already ticked on 2026-10-05, and `merge-base.ts` still passes `--changed <fork point>`.

What `task-io.ts` declares today (read): 15 of 121 regen pairs declare `inputs`, and all 15 are `{tracked}`. So `--changed` and the narrowed fixpoint can only skip a `{tracked}` pair when NOTHING changed. That limit is the same as on 2026-10-05.

Measured on `local/regen-speedup` (4312e99c7, load 2-9):
- The narrowed fixpoint now also settles on a BARREN pass (34aa4e540). Cold regen took 1 pass and 396 s.
- The base code on the same tree took 3 passes and 787 s (load 3-5).
