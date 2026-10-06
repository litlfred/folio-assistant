---
# folio-assistant-v3nf
title: 'SPEED-UP 2: parallel checks — regen and gates run independent --check scripts concurrently, writers stay ordered'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T17:42:24Z
updated_at: 2026-10-06T19:00:41Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-01 late (~17:30, session_01ToWZR4RgTRCWeSsgxsSQfT) as speed-up 2 of 4 for the merge treadmill (S2 `0mf0`, epic `7x5n`). Siblings: input-hash skip, CI merge:main (`d33q` part B), CI sharding + BPMN cache + shallow checkout.

## What
`bun run regen` asks its ~82 verify/write pairs one at a time, and `bun run gates` runs its fast set serially. Run independent checks in parallel, bounded by the CPU count, keeping the output grouped per check and the exit status per check.

## Why
d33q measured regen at ~20–46 min and gates at 29–32 min per round on a 4-core box. Most `--check` scripts read disjoint inputs and write nothing.

## Falsifier
Two writers that touch the same output (or a writer whose output is another check's input — bean `14ve`, regen is not a fixpoint) run concurrently and produce a different tree from the serial order. So: only `--check` (non-writing, bean `ymsu`) runs are parallelised by default; writers stay ordered unless their outputs are declared disjoint, and a test compares the serial and parallel results on one tree.

## Done when
- [x] a concurrency limit (default = CPU count, overridable) in `gates.ts` and `regen-after-merge.ts`
- [x] writers stay serial, or are proven disjoint by declaration
- [x] serial vs parallel give the same verdicts and the same tree (test)
- [ ] measured: wall-clock before/after on the same tree and load


## 2026-10-06

- **Box 1 (concurrency limit), on main (#2112):** `jobsFromArgv` is used in both gates.ts and regen-after-merge.ts. The default is CPUs - 1 (3 here), not the CPU count the box names, and `--jobs N` overrides it.
- **Box 2 (writers stay serial), on main:** `ReadWriteGate` makes every writer run alone and in pair order. A check without a declaration is a barrier. The tests are in `task-pool.test.ts` ("overlap serialization").
- **Box 3 (same verdicts and tree), NEW:** 4312e99c7 on `local/regen-speedup`.
  - The test runs a reverse-ordered writer chain, a stale pair, a failing writer, a no-writer red and an undeclared barrier, under random delays.
  - jobs 2, 3 and 8 each equal jobs 1 in results, settled flag and final state.
- **Box 4 left OPEN:**
  - Measured for regen only, same tree, Bun 1.3.14, load 2.5-4.9: `regen --dry-run --no-cache --jobs 1` took 426 s wall, 428 s user, 156 s sys. `--jobs 3` took 254 s wall, 430 s user, 137 s sys. The verdicts were identical: 119 current, 2 stale.
  - gates' serial vs parallel share was NOT measured separately: a gate run is about 40 minutes here. a2a8e6c63 now prints each serial gate's time. In the last run `bun test` (1525 s) and `check:cat-harness-standalone` (496 s) were 2021 of 2765 s, and the pool cannot shorten either.

_2026-10-06T19:00:41Z_ — Claimed by claude/v3nf-parallel-gates-guard — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
