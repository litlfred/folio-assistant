---
# folio-assistant-14ve
title: 'REGEN NOT A FIXPOINT: bun run regen asks each check once, so a check asked before its input''s writer runs reports current and stays stale'
status: todo
type: bug
priority: normal
created_at: 2026-09-29T23:42:28Z
updated_at: 2026-09-30T08:28:41Z
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


*2026-09-30* — Parented under **1xhc** CI RELIABILITY: it arrived on main with no parent, which fails check:bean-parents on every branch. Chosen by evidence, not taste: its two nearest filed neighbours (lsi:near) — ymsu (kg:detangle:check cannot fail inside gates, 0.55) and lxpq (clean merge, wrong artefact, 0.55) — are both under 1xhc.
