---
# folio-assistant-eahf
$schema: bean/1.0.0
title: 'Memory: S-CI1 (2026-11-01) layer-pr-checks shards split by wall time; core uses 5 shards (8 was tried and was slower because of runner queueing)'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:18:10Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `shard-balance-s-ci1.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: S-CI1 (2026-11-01) layer-pr-checks shards split by wall time; core uses 5 shards (8 was tried and was slower because of runner queueing)


Thread "Balance PR check shards" (sibling S-CI1 of "Make the cone deploy safe to switch on"). Done 2026-11-01.

- cat-harness-tools#1214 (merged b79cea4): `shard_names` balances max(pooled/GATE_JOBS, longest pooled) + alone (TREE_TOOLS) seconds. Under GATE_CONE=record (push) it keeps the summed-seconds split.
- folio-assistant-core#460 (merged 8b85d63): `gate-shards: 5`, pinned to b79cea4.
- 8 shards (run 41287467368): slowest gate step 511 s, but 16 jobs waited up to 17 min for runners, so the run took ~37 min. 5 shards (run 41290191920): slowest 507 s, shards started within 4 min, run took ~26 min. Do not raise the shard count without checking runner queueing.
- Floor left: single gates `check:cat-harness-tools-standalone` and `uml:overview:check` (~450-510 s each). Splitting them is the next lever.

See folio-assistant-vosx.
