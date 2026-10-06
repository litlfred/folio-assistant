---
# folio-assistant-c5fm
title: 'Instantiate folio-assistant-core: config at root so the navbar lists it; declare its docs/'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T14:53:55Z
updated_at: 2026-10-05T16:21:39Z
parent: folio-assistant-0lmb
---

Issue #2196. Owner 2026-10-05 asked whether folio-assistant-core/ is staged and why it is missing from the navbar Harnesses list between WHO IRIS and C@T Harness. Rule: gen-navbar-include.ts lists harnesses with instantiated===true; harness-tiles.ts sets instantiated from <name>.config.json at the root. Core has a declaration but no config.


## 2026-10-05 progress (PR #2197)
- Added folio-assistant-core.config.json at the root. harness-tiles.ts:1207 sets instantiated = existsSync(<root>/<name>.config.json), and gen-navbar-include.ts:197 lists only instantiated harnesses.
- Declared folio-assistant-core-docs (docs/, composed, instanceRoot) with an authored index.md, so the tile goes to /folio-assistant-core/ instead of /#harness-folio-assistant-core.
- Regenerated everything downstream: harness.json, the navbar include, auto-docs, viewer-nav, readme:subgraphs, subgraph:jsonld, uml:overview, the default board and the docs-index wireframe covers.
- preview:site build: the navbar order is folio-assistant, smart-trust, smart-base, who-iris, folio-assistant-core, cat-harness, bootstrap. /folio-assistant-core/ renders.
