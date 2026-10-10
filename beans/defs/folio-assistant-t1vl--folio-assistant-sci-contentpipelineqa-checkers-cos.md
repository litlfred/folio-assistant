---
# folio-assistant-t1vl
title: folio-assistant-sci content/pipeline/qa-checkers-cost.ts imports ../../../cat-harness/content/pipeline/content-graph, moved to cat-harness-tools in 70lx — any test importing qa-checkers-extended fails to load
status: todo
type: bug
priority: normal
created_at: 2026-10-10T16:49:37Z
updated_at: 2026-10-10T17:21:08Z
parent: folio-assistant-ml9h
blocked_by:
    - folio-assistant-ndp0
---

Found by drain lane B, 2026-10-10. Same class as ndp0: a path into cat-harness that 70lx moved to cat-harness-tools.

## Done when
- [ ] qa-checkers-cost.ts imports content-graph from its cat-harness-tools location (PR on litlfred/folio-assistant-sci)
- [ ] the tests importing qa-checkers-extended load and pass
- [ ] a grep across the mounted instances for '../cat-harness/content/pipeline' and 'cat-harness/scripts/' paths that no longer exist is recorded here, so the rest of the class is found at once

## Finding (lane A, 2026-10-10)

Already fixed upstream: litlfred/folio-assistant-sci main c6a07d2 imports every one of these from ../../../cat-harness-tools/…. The index pins sci 99d054e (old paths), and at that pin cat-harness still holds the files, so nothing is broken today. It breaks only if cat-harness is re-pinned past the move without sci. Handed to folio-assistant#2529 (session_017QXvm7c7RDYFguWzSxhrMb): re-pin sci ≥ c6a07d2 in the same PR. Close when #2529 merges.

## Status (17:16 UTC)

In folio-assistant#2529 at 8cf8ee3: cat-harness pinned 96bf374 (includes #110 and #112, the regenerated external-schemas page; checkout test 8/8 locally), folio-assistant-sci pinned c6a07d2. Close when #2529 merges green.
