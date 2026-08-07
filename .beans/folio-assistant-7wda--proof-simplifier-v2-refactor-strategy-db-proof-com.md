---
# folio-assistant-7wda
title: 'proof-simplifier v2: refactor strategy DB + proof-compile-cost metric'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-07T09:57:27Z
---


## Problem

`proof-simplifier.md` has a hand-written anti-pattern table and an MCP-first
workflow, but **no cost measurement**. It references `lean_profile_proof` and
records nothing, so simplification gains are judgment-only and regressions
are invisible.

## Plan

- Versioned refactoring-strategy sidecar. Lean Refactor's (arXiv 2605.20244)
  real contribution is the strategy DB annotated with supported Lean/Mathlib
  versions + expected compile-cost reduction — a data asset that can grow
  incrementally, steering a frozen LLM with no fine-tuning.
- `proof-compile-cost` in the sidecar `metrics` payload, from
  `lean_profile_proof`, so before/after is measurable.
- Proof-Refactor (arXiv 2606.03743) is built on Claude Code + lean-lsp-mcp —
  same stack as folio, so its loop is the cheapest thing to lift.

Note: "LeanRefiner" as originally named does not resolve to a real project;
this bean covers the real work in that space.

## Landed

Both halves.

**Strategy DB.** `schemas/refactor-strategy.ts` + 11 seeded strategies
from proof-simplifier's prose table + `refactor-strategy.ts` loader with
version-gated query (fails closed on an undeclared range). 14 unit tests,
including that version comparison is numeric — "4.9.0" > "4.24.0" as
strings, exactly folio's range. Content repos can shadow a shipped
strategy by id.

Seeding surfaced a documentation error: the old table listed
`unfold f; rw [...]` -> `simp [f, ...]` as a flat equivalence. It isn't —
`rw` rewrites once at the first match, `simp` to normal form. Now
`proposed` with that caveat.

**Cost metric.** `lean-profile-ingest.ts` (--ingest / --stale / --report)
+ `qa-checkers-cost.ts` + criteria `proof-compile-cost` (measurement,
never a gate — no "too slow" threshold invented) and
`proof-no-cost-regression` (>25%, loose because elaboration timing is
noisy and a tight bound trains reviewers to ignore it).

Testing caught a real bug: the demotion guard required the prior
measurement to still match the *current* file, which after a refactor it
never does — so `previous` stayed empty and regression detection could
never fire. A baseline is valid BECAUSE it was taken on the pre-refactor
source. Fixed, then verified end-to-end on qou: tactic_count 10 -> 6
(shorter) with elab_ms 400 -> 900, correctly flagged. That is precisely
the trap the criterion exists for.
