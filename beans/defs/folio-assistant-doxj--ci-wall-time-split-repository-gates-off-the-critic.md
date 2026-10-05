---
# folio-assistant-doxj
title: 'CI wall time: split Repository gates off the critical path, cache Chromium'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T05:46:34Z
updated_at: 2026-10-05T05:47:08Z
parent: folio-assistant-hfag
---

Owner goal 2026-10-05 "CI build speedup" (session_01VfkKocGaQW7Msro2t5S66U): make code-quality-gates.yml wall time as short as possible without dropping or weakening any gate. Follows `dlqu` (SPEED-UP 4).

## Measured before
main run 37253911158 (98ab8cd, green): ~9m20s wall. Critical path = `Repository gates (hard)` 8m33s, of which `check:cat-harness-standalone` alone is 4m09s (added by #1977). Next longest: bun test shard 1 3m36s.

## Plan
1. `check:cat-harness-standalone` into its own parallel job.
2. Remaining gates steps into two balanced parallel jobs; `Repository gates (hard)` kept as the check NAME on a roll-up that is green only if all three succeeded (same shape as `typescript` / `e2e`).
3. qa-publish waits only for the two corpus parts, so it runs beside the standalone ratchet.
4. Cache Playwright Chromium in e2e shards.

## Done when
PR CI is green apart from main's known reds, every step that ran before still runs (step-name diff), and the PR carries a before/after job timing table.


Issue: #2153
