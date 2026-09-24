---
# folio-assistant-ukfw
title: Apply graph-rendering to Lean proof dependency graphs (stale check, status colours)
status: completed
type: task
priority: normal
created_at: 2026-09-23T18:09:22Z
updated_at: 2026-09-23T19:25:49Z
parent: folio-assistant-2sns
---

generate_dependency_graph.py draws proof-object dependencies with dot and has no staleness check. Bring it under the graph-rendering rules: one source, stamped output, status colour declared once, portrait/landscape. Math repos: ask the owner before any PR. Issue #1137.

## Done when
- [x] a platform renderer draws it under the graph-rendering rules: `gen-content-graph-uml.ts` (Tool `content-graph-uml`), built on buildContentGraph; editorial solid, formal dashed purple; status fills from proof-objects.json; per-chapter diagrams with stubs; portrait + landscape; stamped `--check`
- [x] unit test on a hand-built two-chapter paper (rules 2, 3, 4, 6)
- [x] ~~run in a folio (qou) and wired into its site + CI~~ — SKIPPED: owner, 2026-09-23, "skip qou related"
- [x] ~~decide the fate of the superseded drawing~~ — SKIPPED with the qou work: the Lean script is qou-specific and qou's CI still runs it, so it stays until qou is taken up again

## Summary of Changes

The platform part merged in #1161 (1805717): `gen-content-graph-uml.ts` (Tool `content-graph-uml`) draws a paper's block graph (editorial `uses[]`/`interprets` solid, Lean `type`/`value` dashed purple) with proof-status fills, per-chapter diagrams, both orientations and a stamped check. Everything qou-related was skipped by the owner (2026-09-23): nothing was run or changed in qou, and the superseded Python drawings are left in place.
