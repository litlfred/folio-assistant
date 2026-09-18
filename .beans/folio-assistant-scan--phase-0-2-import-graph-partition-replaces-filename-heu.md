---
# folio-assistant-scan
title: 'Phase 0.2 — import-graph partition replaces the filename heuristic (#223)'
status: todo
type: task
priority: high
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
---

The 101 sci / 94 WHO file counts in
[current state](../docs/architecture/current-state.md) come from matching
filenames. That is a **lower bound**: it finds `lean-build-bg.sh` and misses a
Lean special case inside a generic validator.

Build the real import/call graph and partition it against the five proposed
repos. Output: per-repo module lists, plus the list of edges crossing a proposed
boundary **in the wrong direction** (a would-be `folio-assist-core` module
importing a Lean module). That cross-edge list is Phase I's actual worklist.

Independent of 0.1 — can run in parallel.
