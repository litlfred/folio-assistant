---
# folio-assistant-xpcu
title: 'REGEN + GATES SPEED-UP: input-hash staleness skipping and a parallel worker pool for regen-after-merge and gates'
status: in-progress
type: feature
priority: high
created_at: 2026-10-01T17:26:24Z
updated_at: 2026-10-06T19:35:03Z
parent: folio-assistant-7x5n
---

## Why

Measured by the steward: `bun run regen` runs ~83 check/writer pairs serially
via `spawnSync`, up to 3 passes, ~25 min locally. `bun run gates` takes >50 min
locally. The box has 4 CPUs shared with other sessions.

## What (owner-approved, 2026-10-01)

1. **Input-hash staleness skipping** in regen: hash each pair's declared inputs
   plus its script source; skip when it matches the hash recorded at the last
   green run. Cache is git-ignored, never committed. Undeclared or
   undeterminable inputs always run. `--no-cache`, `--explain`. CI unchanged
   (cache absent/disabled under `CI`).
2. **Parallel pool** (`--jobs`, default `max(1, cpus-1)`) for regen pairs and
   for read-only gates; overlapping or undeclared outputs serialize; output
   buffered and printed in original order.

## Done when

- One PR on `claude/regen-gates-speedup` with unit tests for hash skip,
  could-not-determine runs, overlap serialization and ordering.
- Before/after wall times measured and in the PR body, with box load noted.

Claimed by session https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT on branch claude/regen-gates-speedup (2026-10-01).


## 2026-10-06

Measured on `claude/laughing-fermat-v46nqs` @ d82b69e11 and on local branch `local/regen-speedup` (Bun 1.3.14, 4 CPUs shared; load average noted per run).

**Already on main (read in the code, seen in run output):** the worker pool and input-hash cache (#2112: "3 worker(s); input-hash cache ON"), `--changed` and the narrowed fixpoint (#2141, bean 94zs), the skill:register/kg:audit folds and the un-barriering (#2144, bean 8qyc). The unit tests named in "Done when" exist in `cat-harness/scripts/tests/task-pool.test.ts`. Whether the PR body carried before/after timings cannot be checked from the repository.

**Added on `local/regen-speedup`, not on main yet:**
- 8dd50a7a7: gates skips a check whose declared inputs are unchanged since it last passed. regen and gates share check-level records (bean f017).
- 34aa4e540: a BARREN pass settles regen. That is a pass whose writers repaired nothing and measurably changed nothing.
- a2a8e6c63: gates prints each serial gate's time.
- 4312e99c7: a test that serial and parallel regen give the same verdicts and tree (bean v3nf).

**Numbers (`bash time`, WALL/USER/SYS in seconds):**

| run | code | wall | user | sys | load | notes |
|---|---|---|---|---|---|---|
| regen, cold cache | base d82b69e11 | 787 | 1300 | 406 | 3-5 | 3 passes (121+121+106 pairs asked) |
| regen, cold cache | 34aa4e540 | 443 | 430 | 127 | 10-14 | 1 pass (barren) |
| regen, cold cache | 4312e99c7 | 396 | 537 | 181 | 2-9 | 1 pass (barren) |
| regen, warm cache, same tree | 4312e99c7 | 231 | 306 | 107 | 8-10 | 13 pairs skipped |
| gates (fast set) | base | >=2463 (killed at 250/251) | - | - | 4-5 | no skipping |
| gates after regen | 8dd50a7a7 | 2493 | 2157 | 706 | 4-13 | 9 gates skipped |
| gates again, same tree | 8dd50a7a7 | 2254 | 2080 | 738 | 4-5 | 10 gates skipped |
| gates after regen | 4312e99c7 | 2765 | 2507 | 923 | 2-6 | 9 skipped; bun test 1525 s, check:cat-harness-standalone 496 s |

Other jobs on the box: other sessions' regen/gates and `bun test` (worktrees 2197, 2088), and a `git index-pack`. The two gates runs are not directly comparable on wall time.

**Where the gate time goes now:** two SERIAL gates are 2021 of 2765 s: `bun test` (1525 s) and `check:cat-harness-standalone` (496 s, undeclared, so it runs as a barrier). The 10 skippable gates cost about 250 s of summed time in the base run.

## 2026-10-06 (later) — speed dispatch, session_01GGe2PsYLUNUwb4HNMR2qsc, branch claude/speed-merge-loop, PR #2321

Not claiming xpcu (held by the 10-01 session; its branch has no open PR and its work is on main). v3nf was claimed at 19:00 by claude/v3nf-parallel-gates-guard, so gates parallelism stays theirs. This session took **7how**, because 7how is why the PR recipe has six steps.

**Today's recipe, measured** (Bun 1.3.14, 4 CPUs, load 2-3; branch warmed on c5714c8b41, then merged bcf8dc3c74 = ~2 h of main, 0 conflicts):

| step | warm round | merge round |
|---|---|---|
| state:mount | 9 s | 3 s |
| regen | 590 s | 389 s |
| qa:working-copy | 292 s | 263 s |
| kg:detangle | 5 s | 5 s |
| regen again | 179 s (all current) | 121 s (all current) |
| **total** | **1075 s** | **781 s** |

Where qa:working-copy goes: skill:register 124 s, kg:audit:all 87 s (73 %); 26 other writers ≤ 17 s each.
The first regen of the warm round 'regenerated' uml:overview from a QA copy it had not built: the 7how defect, seen live.
