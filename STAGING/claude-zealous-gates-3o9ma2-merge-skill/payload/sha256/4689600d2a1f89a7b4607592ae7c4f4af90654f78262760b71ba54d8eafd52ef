---
# folio-assistant-v3nf
title: 'SPEED-UP 2: parallel checks — regen and gates run independent --check scripts concurrently, writers stay ordered'
status: todo
type: task
created_at: 2026-10-01T17:42:24Z
updated_at: 2026-10-01T17:42:24Z
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
- [ ] a concurrency limit (default = CPU count, overridable) in `gates.ts` and `regen-after-merge.ts`
- [ ] writers stay serial, or are proven disjoint by declaration
- [ ] serial vs parallel give the same verdicts and the same tree (test)
- [ ] measured: wall-clock before/after on the same tree and load
