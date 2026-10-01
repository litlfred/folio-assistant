---
# folio-assistant-f017
title: 'SPEED-UP 1: input-hash skip — a check whose declared inputs are unchanged since its last green run is skipped and says so'
status: todo
type: task
created_at: 2026-10-01T17:42:23Z
updated_at: 2026-10-01T17:42:23Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-01 late (~17:30, session_01ToWZR4RgTRCWeSsgxsSQfT) as speed-up 1 of 4 for the merge treadmill (S2 `0mf0`, epic `7x5n`). Siblings: parallel checks, CI merge:main (`d33q` part B), CI sharding + BPMN cache + shallow checkout.

## What
Each verify/write pair that `bun run regen` / `bun run gates` runs records a hash of its declared INPUTS (the files it reads plus its own script) next to its output. When the hash is unchanged since the last green run, the check is skipped and reported as `skipped (inputs unchanged)` — a distinct state, never rendered as `current`.

## Why
A merge → regen → gates cycle takes ~50–80 min of agent wall-clock on a loaded 4-core box (d33q's measurement, 2026-10-01) while main moves every ~3 min. Most pairs' inputs do not change between two rounds of the same branch.

## Falsifier
A check whose real inputs are wider than its declared inputs would be skipped while stale. So: the input set must be declared, not inferred, and a test must show that editing an undeclared-but-read file is caught (or the check refuses to skip when it cannot enumerate its inputs — the third state, never "unchanged").

## Done when
- [ ] input-set declaration per pair, and the hash store (committed or cache, decided with reasons)
- [ ] `regen` and `gates` skip on an unchanged hash and say so
- [ ] a test per refusal case (inputs not enumerable → runs)
- [ ] measured: regen wall-clock before/after on the same tree
