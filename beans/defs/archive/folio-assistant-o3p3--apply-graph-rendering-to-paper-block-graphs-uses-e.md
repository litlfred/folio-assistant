---
# folio-assistant-o3p3
title: Apply graph-rendering to paper block graphs (uses[] editorial vs formal, chapters as groups)
status: completed
type: task
priority: normal
created_at: 2026-09-23T18:09:22Z
updated_at: 2026-09-23T19:25:48Z
parent: folio-assistant-2sns
---

Replace or wrap content-graph-analysis.py with a renderer built on buildContentGraph: groups = chapters, editorial and formal edges drawn distinctly, portrait/landscape, stamped staleness check. Folio content lives in separate repos (qou): ask the owner before any PR there. Issue #1137.

## Done when
- [x] a platform renderer draws it under the graph-rendering rules: `gen-content-graph-uml.ts` (Tool `content-graph-uml`), built on buildContentGraph; editorial solid, formal dashed purple; status fills from proof-objects.json; per-chapter diagrams with stubs; portrait + landscape; stamped `--check`
- [x] unit test on a hand-built two-chapter paper (rules 2, 3, 4, 6)
- [x] ~~run in a folio (qou) and wired into its site + CI~~ — SKIPPED: owner, 2026-09-23, "skip qou related"
- [x] ~~decide the fate of the superseded drawing~~ — SKIPPED with the qou work: the Lean script is qou-specific and qou's CI still runs it, so it stays until qou is taken up again

## Summary of Changes

The platform part merged in #1161 (1805717): `gen-content-graph-uml.ts` (Tool `content-graph-uml`) draws a paper's block graph (editorial `uses[]`/`interprets` solid, Lean `type`/`value` dashed purple) with proof-status fills, per-chapter diagrams, both orientations and a stamped check. Everything qou-related was skipped by the owner (2026-09-23): nothing was run or changed in qou, and the superseded Python drawings are left in place.
