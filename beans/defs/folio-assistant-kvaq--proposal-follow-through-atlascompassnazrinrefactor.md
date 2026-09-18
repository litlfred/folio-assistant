---
# folio-assistant-kvaq
title: 'Proposal follow-through: Atlas/Compass/Nazrin/refactor skills + checks'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:28:10Z
updated_at: 2026-08-07T11:55:44Z
---


Tracks the skills + checks proposed in
`docs/proposals/llm-authoring-tool-integration.md` §2-§6, sequenced in §8.

Umbrella for: dm4g (Atlas ingest), ajsu (Compass scoping), 6xhf
(staleness split), 7wda (refactor DB + cost), nimj (Nazrin oracle),
15gn (LeanDojo, deferred).

New skills proposed there, not yet written:
- `lean-atlas-ingest`, `semantic-review-scoping` (dm4g / ajsu)
- `refactor-strategy-curator` (7wda)

New checks proposed there, not yet registered:
- `proof-statement-dep-drift`, `lean-ref-owns-decl` (Atlas)
- `proof-semantic-cone-reviewed` (Compass)
- `proof-not-machine-trivial` (Nazrin — gate on FP-rate evaluation first)
- `proof-compile-cost`, `proof-no-cost-regression` (refactor cluster)

## Summary of Changes

Proposal follow-through closed out. What landed across the session:

**Code** — content-graph, lean-atlas-ingest (+scan fallback), semantic-cone,
refactor-strategy DB, lean-profile-ingest, lean-signature, lake-cache.sh.

**Criteria** — uses-editorial-hygiene / -completeness / -formal-coverage,
lean-ref-owns-decl, proof-compile-cost, proof-no-cost-regression,
proof-not-machine-trivial (scaffold).

**Skills** — uses-editorial-review, lean-cache-restore, lean-formal-graph,
semantic-review-scoping, simulator-math-audit (recovered), plus
proof-simplifier rewired to the strategy DB.

## Deliberately NOT registered

- `proof-semantic-cone-reviewed` — would assert a cone is fully reviewed.
  Under `scan` confidence an under-sized cone would certify completeness
  that was never established. Needs `source: "atlas"` data.
- `proof-statement-dep-drift` — cross-block staleness propagation. Same
  dependency: needs trustworthy type/value edges.

Both are ready to add the moment a real Atlas export exists; the graph
already carries `formalSource` so they can gate on it.

## Follow-ups left open

- `nimj` — triviality oracle scaffolded, false-positive rate unmeasured.
- `15gn` — LeanDojo, deferred by design.
- `8agu`/`n1wp` — content-repo side awaiting litlfred/qou#4678.
