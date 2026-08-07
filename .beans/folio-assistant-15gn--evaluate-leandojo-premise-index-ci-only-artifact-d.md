---
# folio-assistant-15gn
title: Evaluate LeanDojo premise index (CI-only artifact) — deferred
status: todo
type: task
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-07T09:13:35Z
---


## Status: deferred, evaluate only

LeanDojo (arXiv 2306.15626, MIT) gives a traced-repo artifact with premise-use
annotations, a premise index, and a programmatic `run_tac` environment.

`formalizer` steps 3-4 currently use `lean_leansearch` / `lean_loogle` —
network calls to external services. A local premise index would be
offline-capable and repo-specific.

Against: heavy full-build trace, Python-side against a Bun/TS pipeline,
version-pinned to specific Lean/Mathlib. CI-only artifact if adopted at all,
and likely redundant with leansearch/loogle for most folios.

Revisit only if a folio hits real leansearch/loogle latency or needs offline
operation. ReProver as a fallback tactic generator: skip.
