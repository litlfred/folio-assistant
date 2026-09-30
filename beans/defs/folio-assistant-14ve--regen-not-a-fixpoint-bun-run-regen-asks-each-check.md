---
# folio-assistant-14ve
title: 'REGEN NOT A FIXPOINT: bun run regen asks each check once, so a check asked before its input''s writer runs reports current and stays stale'
status: todo
type: bug
priority: normal
created_at: 2026-09-29T23:42:28Z
updated_at: 2026-09-29T23:59:55Z
parent: folio-assistant-1xhc
---

Measured 2026-09-29 on claude/sharp-einstein-970n6g (PR #1511), after merging main:

- `bun run regen` pass 1: "58 current, 4 regenerated, 0 unrepaired", exit 0.
- `navbar:include:check` still failed, and so did `gen-navbar-include.test.ts` ("the writer is a fixpoint over the real data").
- Cause: the navbar include is generated from `cat-harness/docs/_data/harness.json`, which `docs:harness` writes. `docs:harness` was regenerated in the same pass, but after `navbar:include:check` had been asked and answered "current".
- Pass 2 regenerated `state:visualizer`. Pass 3 regenerated nothing.

So one pass of `cat-harness/scripts/regen-after-merge.ts` reports success over a tree that still fails gates. That is the `lxpq` shape it exists to prevent, one layer along: an assertion of correctness that no generator would make.

## Fix
Loop the ask-and-regenerate pass until one pass regenerates nothing, capped at a few passes. Report a pass that is still regenerating at the cap as a finding. Keep the four states (current / regenerated / unrepaired / no-writer). A loop cannot drift from the real dependencies; a hand-ordered list can.

## Done when
- [ ] after a merge that leaves harness.json stale, one `bun run regen` leaves every check current
- [ ] a unit test covers a two-step dependency: writer B's output is an input to check A, and A is asked first

## Measured again, 2026-09-30 (PR #1530 merge of main)

`bun run regen` reported `60 current, 2 regenerated (skill:register,
readme:subgraphs), 0 unrepaired`, yet the next `bun run gates` failed
`audit:coverage:require-all` and `audit:coverage:strict`: the committed
`audit-coverage.qa-results.json` disagreed with the run. Running
`bun run audit:coverage` once fixed both. Consistent with an ORDER
dependence: audit-coverage was asked before the later writers changed the
files it counts, so one pass is not a fixpoint.
