---
# folio-assistant-o3p3
title: Apply graph-rendering to paper block graphs (uses[] editorial vs formal, chapters as groups)
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T18:09:22Z
updated_at: 2026-09-23T18:52:18Z
parent: folio-assistant-2sns
---

Replace or wrap content-graph-analysis.py with a renderer built on buildContentGraph: groups = chapters, editorial and formal edges drawn distinctly, portrait/landscape, stamped staleness check. Folio content lives in separate repos (qou): ask the owner before any PR there. Issue #1137.

## Done when
- [x] a platform renderer draws it under the graph-rendering rules: `gen-content-graph-uml.ts` (Tool `content-graph-uml`), built on buildContentGraph; editorial solid, formal dashed purple; status fills from proof-objects.json; per-chapter diagrams with stubs; portrait + landscape; stamped `--check`
- [x] unit test on a hand-built two-chapter paper (rules 2, 3, 4, 6)
- [ ] run in a folio (qou) and wired into its site + CI — needs the owner's go-ahead before any PR in qou
- [ ] decide the fate of the superseded drawing (content-graph-analysis.py / .github/scripts/generate_dependency_graph.py) — owner's call
