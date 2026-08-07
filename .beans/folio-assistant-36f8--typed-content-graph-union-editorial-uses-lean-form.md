---
# folio-assistant-36f8
title: 'Typed content graph: union editorial uses[] + Lean formal dep graph'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:26Z
updated_at: 2026-08-07T09:28:10Z
---


## Problem

`loadChapterGraph()` in `content/pipeline/qa-checkers-extended.ts` builds a
single `_usesGraph` from `uses[]` alone, by regex over block `.ts` files.
Every detangler metric (in/out-degree, cone_size, depth, pagerank,
graph_energy, cycles) and `conjectural-propagation-sweep.ts` run on it.

That graph is missing the formal edges entirely — the Lean dependency
structure is not attached to content blocks at all.

## Design

Build a **typed multi-edge graph**. Each edge carries provenance:

- `editorial` — from `uses[]` (agent/human maintained)
- `formal` — from the Lean dep graph, resolved decl -> `lean.ref` -> label

Graph algorithms consume the **union** by default; each metric may scope to
one edge kind where that is the right question (e.g. conjectural
propagation is a *formal* soundness question; graph-energy /
forward-reference ordering is an *editorial* reading-order question).

Formal edges resolve back to content-block labels via the `lean.ref`
(`pkg:Decl`) index, so a Lean dep between two decls becomes an edge between
the two blocks that own them. Lean deps with no owning block are dropped
(they're Mathlib/library, not corpus structure).

Blocked on: dm4g (Lean Atlas ingest) for the formal edge source. Until that
lands, the formal edge set is empty and the union degrades to today's
behaviour — no regression.
