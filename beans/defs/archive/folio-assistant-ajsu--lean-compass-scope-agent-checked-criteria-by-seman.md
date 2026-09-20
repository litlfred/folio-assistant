---
# folio-assistant-ajsu
title: 'Lean Compass: scope agent-checked criteria by semantic-impact cone'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:34Z
updated_at: 2026-08-07T09:49:58Z
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

## Landed

`content/pipeline/semantic-cone.ts` — `semanticCone()`, `coneCoverage()`,
plus a CLI (`--targets`, `--coverage`, `--json`).

The algorithm: transitive closure over **type** (statement-level) edges
only. Value (proof-level) edges terminate propagation, and that
termination IS the reduction. Rationale: if T's statement is phrased in
terms of D and D encodes the wrong notion, T claims the wrong thing
however good its proof; but if T's proof merely invokes L, the kernel has
already checked T follows from L, so whether L *means* what its author
intended cannot change what T claims.

`coneCoverage()` reports cone members lacking a FRESH adjudication of each
agent-checked criterion (criteria list derived from the registry, so a new
`automated: false` entry is covered without touching this file).

Verified on qou: `conj:q-gl-fiber-functor` -> 12-member cone, transitively
pulling in def:q-oper, def:q-langlands-dual, def:q-local-system etc.;
coverage reports 120 criterion-blocks owed. Versus 2958 blocks x 10
agent-checked criteria if swept blind.

Two honesty guards added during testing:
- `noPropagation` — a cone equal to its targets means NO EDGE WAS
  TRAVERSED. The first CLI run reported "99.9% reduction" for exactly
  that case, which reads as a triumph and is actually missing data.
- `confidence` — `atlas` / `scan` / `editorial-only`, surfaced in every
  output. Under `scan` a missed type edge SHRINKS the cone, which is the
  dangerous direction.

## Deliberately NOT done

`proof-semantic-cone-reviewed` (proposed in the docs) is not registered.
It would assert "the cone is fully reviewed", and under `scan` confidence
that claim can be wrong in the unsafe direction — an under-sized cone
would certify completeness that was never established. Register it once
`source: "atlas"` data exists. The tooling is ready for it.
