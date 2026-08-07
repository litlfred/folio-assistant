---
# folio-assistant-ajsu
title: 'Lean Compass: scope agent-checked criteria by semantic-impact cone'
status: todo
type: task
created_at: 2026-08-07T09:13:34Z
updated_at: 2026-08-07T09:13:34Z
---


## Ask

The expensive criteria are all `automated: false` — `proof-narrative-lean-equiv`,
`proof-statement-integrity`, the four vacuity criteria, the three `proof-rater-*`.
Each costs agent turns, and today a sweep has no principled ordering.

Lean Compass (the Lean Atlas core algorithm) computes, for a target theorem
set, the minimal set of project-specific nodes whose *semantic* correctness
can affect those targets (reported 227 -> 14 nodes in the paper's example).

Use it to order `integration-backlog` / `proof-triage` dispatch and to bound
which blocks need re-adjudication after a change. Pure agent-budget savings;
no schema change. Depends on dm4g.
