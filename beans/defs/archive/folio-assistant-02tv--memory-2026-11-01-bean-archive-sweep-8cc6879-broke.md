---
# folio-assistant-02tv
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 bean archive sweep (8cc6879) broke fa bun-test shards 1+2; fix in cat-harness-tools#1250 (issue #1248), needs merge OK + fa re-pin'
status: completed
type: task
priority: low
created_at: 2026-11-01T10:34:29Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bean-archive-sweep-tests.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 bean archive sweep (8cc6879) broke fa bun-test shards 1+2; fix in cat-harness-tools#1250 (issue #1248), needs merge OK + fa re-pin


Bean store commit 8cc6879 (09:59Z 2026-11-01, fa#860, Q-FAD-4 A) moved 698 terminal beans to beans/defs/archive/, leaving 30 open. Archive is a VIEW (bean e8m3): readBeans is non-recursive on purpose; readArchivedBeans reads the archive.
Effects: fa bun test shard 2 (5 size-floor tests) and shard 1 (subgraphs-checkout: 50 dangling links from/to archived beans) red on every fa PR.
Fix: cat-harness-tools#1250 (merged 62283a4) + #1270 (merged 10c307b 2026-11-01 15:24Z; w0cr baseline, bean-blocks/harness-dirs/doneWhenState/edge-union/l9v6 tests), thread "Fix bean tests broken by drains": tests use exact/on-disk counts + history floor; check-subgraphs resolves links across the defs/archive pair. Q-BT1 A, Q-BT2 A. fa#2872 closed as superseded; fa#2864 must pin tools >= 10c307b. Issue #1248 closed. `beans archive` rewrites no links, so the resolver fallback is the lasting fix.
