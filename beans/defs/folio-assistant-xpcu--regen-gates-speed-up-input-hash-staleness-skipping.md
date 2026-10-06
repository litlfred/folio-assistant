---
# folio-assistant-xpcu
title: 'REGEN + GATES SPEED-UP: input-hash staleness skipping and a parallel worker pool for regen-after-merge and gates'
status: in-progress
type: feature
priority: high
created_at: 2026-10-01T17:26:24Z
updated_at: 2026-10-06T10:47:13Z
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

## 2026-10-06 (late): f017 measured on PR #2327 (`244608c`)

- **regen warm:** 179 s with 62 of 121 pairs skipped (231 s and 13 before). Cold: 404 s.
- **gates on the same tree:** 136 of 251 gates skipped (10 before).
- **gates wall time:** 1840 s, nearly unchanged. `bun test` (935 s) and `check:cat-harness-standalone` (338 s) are serial and not skippable, and together they are 1273 s of that. The next speed-up is theirs: v3nf, and test sharding. Details are in bean f017.
