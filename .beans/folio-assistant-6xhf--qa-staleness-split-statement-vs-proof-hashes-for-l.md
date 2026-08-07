---
# folio-assistant-6xhf
title: 'QA staleness: split statement-vs-proof hashes for .lean'
status: todo
type: task
created_at: 2026-08-07T09:13:34Z
updated_at: 2026-08-07T09:13:34Z
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
