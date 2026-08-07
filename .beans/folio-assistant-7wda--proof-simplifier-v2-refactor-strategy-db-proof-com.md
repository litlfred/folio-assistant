---
# folio-assistant-7wda
title: 'proof-simplifier v2: refactor strategy DB + proof-compile-cost metric'
status: todo
type: task
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-07T09:13:35Z
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
