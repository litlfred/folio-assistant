---
# folio-assistant-6xhf
title: 'QA staleness: split statement-vs-proof hashes for .lean'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:34Z
updated_at: 2026-08-07T11:28:20Z
---


## Problem

`QaFieldHash.lean` is a whole-file hash. Touching a proof body invalidates
`proof-narrative-lean-equiv`, which only cares about the *signature*.
Staleness is also per-block only — it never propagates along dependency
edges (a few checkers such as `proof-no-conj-propagation-violation` read the
cone via a cached witness, but the staleness layer itself does not).

## Plan

Extend `QaFieldHash` in `schemas/block-qa.ts` with statement-level and
proof-level hashes; teach `qa-staleness.ts` + `qa-utils.ts` which criteria
key off which. Atlas's type-vs-value edge classification (dm4g) is the
signal for propagating invalidation across blocks correctly.

Do after dm4g so the edge classification is available.

## Summary of Changes

Per-block statement/proof split — and it did NOT need Atlas. The Atlas
dependency was for CROSS-BLOCK propagation, a separate piece; the per-block
split reuses the Lean lexer already written for the scan fallback.

- `QaFieldHash.lean_statement` — hash of declaration signatures only.
- `content/pipeline/lean-signature.ts` — extraction + hashing, built on
  `stripLeanComments` / `splitDeclarations` from lean-atlas-ingest.
- `QaCriterionDefinition.lean_granularity: "file" | "statement"`.
  `proof-narrative-lean-equiv` and `proof-statement-integrity` opt in;
  everything else keeps whole-file granularity.
- `entryIsFresh` takes granularity; all five callers pass it.

Fails safe by construction: falls back to the whole-file hash whenever
either side lacks a statement hash (unlexable file, or an entry written
before the field existed). That over-invalidates, which is the acceptable
direction — under-invalidating would present a stale verdict as current,
and both opted-in criteria are agent-adjudicated.

9 tests (`scripts/tests/lean-signature.test.ts") covering proof-rewrite
invariance, signature change, RENAME (a statement change even at identical
type), doc-comment insensitivity, and all three fallback paths.

Measured on qou: 1209 blocks with .lean, **1193** derive a statement hash,
16 fall back safely. So a proof-body edit now leaves the narrative-equivalence
and statement-integrity verdicts fresh on ~99% of Lean blocks instead of
re-queueing an agent turn that could not have changed the answer.

## Deferred

Cross-block staleness propagation (a statement change invalidating
DOWNSTREAM blocks' verdicts) still needs Atlas's type/value edges at
`source: "atlas"` confidence. Tracked under kvaq.
