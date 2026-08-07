---
# folio-assistant-3cw6
title: 'uses[] is editorial-only: clarify semantics across schema, skills, docs'
status: in-progress
type: task
priority: normal
created_at: 2026-08-07T09:13:26Z
updated_at: 2026-08-07T09:15:08Z
---


## Problem

`uses[]` is documented as "Labels of **immediate** dependencies (`\uses{}` in
LaTeX)" (`schemas/types.ts` BlockBase). That reads as a *formal* dependency
relation, and downstream code treats it as the one true dependency graph.

It is not. `uses[]` is the **editorial / narrative / exposition** relation:
"a reader needs block B in hand to follow block A". It is agent/human
maintained. The **formal** relation is the Lean dependency graph, derived
from `lean.ref` — machine-derived, never hand-written.

## Scope

- `schemas/types.ts` — rewrite the `BlockBase.uses` doc comment.
- `schemas/constraints.ts` — `uses-resolve`, `citesProvable` (algorithm rule).
- `content/pipeline/prune-transitive-deps.ts` — transitive pruning is only
  valid on the editorial relation; say so.
- `content/pipeline/render-latex.ts` — emits `\uses{}` to the blueprint;
  confirm that stays editorial-only.
- Skill docs that describe `uses[]` as a dependency graph:
  `folio-core/content-graph.md`, `chapter-complexity-review.md`,
  `block-density.md`, `folio-paper-adapter/critical-path-analysis.md`,
  `proof-simplifier.md`, `proof-status-tracking.md`, `proof-triage.md`.
- `docs/` content-model page.

## Non-goals

Do NOT auto-populate `uses[]` from Lean. Do NOT gate on divergence.
