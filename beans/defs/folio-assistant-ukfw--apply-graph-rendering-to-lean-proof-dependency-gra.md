---
# folio-assistant-ukfw
title: Apply graph-rendering to Lean proof dependency graphs (stale check, status colours)
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T18:09:22Z
updated_at: 2026-09-23T18:52:18Z
parent: folio-assistant-2sns
---

generate_dependency_graph.py draws proof-object dependencies with dot and has no staleness check. Bring it under the graph-rendering rules: one source, stamped output, status colour declared once, portrait/landscape. Math repos: ask the owner before any PR. Issue #1137.

## Done when
- [x] a platform renderer draws it under the graph-rendering rules: `gen-content-graph-uml.ts` (Tool `content-graph-uml`), built on buildContentGraph; editorial solid, formal dashed purple; status fills from proof-objects.json; per-chapter diagrams with stubs; portrait + landscape; stamped `--check`
- [x] unit test on a hand-built two-chapter paper (rules 2, 3, 4, 6)
- [ ] run in a folio (qou) and wired into its site + CI — needs the owner's go-ahead before any PR in qou
- [ ] decide the fate of the superseded drawing (content-graph-analysis.py / .github/scripts/generate_dependency_graph.py) — owner's call
