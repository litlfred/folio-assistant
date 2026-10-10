---
# folio-assistant-t1vl
title: folio-assistant-sci content/pipeline/qa-checkers-cost.ts imports ../../../cat-harness/content/pipeline/content-graph, moved to cat-harness-tools in 70lx — any test importing qa-checkers-extended fails to load
status: todo
type: bug
created_at: 2026-10-10T16:49:37Z
updated_at: 2026-10-10T16:49:37Z
parent: folio-assistant-ml9h
---

Found by drain lane B, 2026-10-10. Same class as ndp0: a path into cat-harness that 70lx moved to cat-harness-tools.

## Done when
- [ ] qa-checkers-cost.ts imports content-graph from its cat-harness-tools location (PR on litlfred/folio-assistant-sci)
- [ ] the tests importing qa-checkers-extended load and pass
- [ ] a grep across the mounted instances for '../cat-harness/content/pipeline' and 'cat-harness/scripts/' paths that no longer exist is recorded here, so the rest of the class is found at once
