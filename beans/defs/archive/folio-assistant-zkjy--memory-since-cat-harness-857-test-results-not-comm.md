---
# folio-assistant-zkjy
$schema: bean/1.0.0
title: 'Memory: Since cat-harness#857 (test/results not committed), downstream gates can go unknown/order-dependent; how tools#1198 handles test runs, and the open f...'
status: completed
type: task
priority: low
created_at: 2026-10-31T22:32:01Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `derived-test-results-in-mounts.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Since cat-harness#857 (test/results not committed), downstream gates can go unknown/order-dependent; how tools#1198 handles test runs, and the open follow-up


cat-harness#857 (merged 2026-10-31 14:32Z) stopped committing `cat-harness/test/results/`. Its store branch `cat/cat-harness/qa-reports` lives on litlfred/folio-assistant, so a repo that mounts cat-harness (dth-hrh, smart-ra, dth-*) cannot read it: qa-store reads the store from the checkout's own `origin`.

Effects seen 2026-10-31:
- `kg:audit:check` graded the three test-run criteria `unknown` (critical gates). Fixed by tools#1198 (6417b9d): `scripts/test-run-compute.ts` declares TEST_RUN_WRITERS (eval:crdm-detect) and kg-audit runs them into a temp dir via `QA_TEST_RUN_OUT_DIR`. Any repo pinning cat-harness ≥ d9223fb needs tools ≥ 6417b9d. dth-hrh re-pinned in dth-hrh#71.
- `check:kind-validators` "EXAMINED NOTHING — qa" depends on gate run order: tools#1204 (open).
- CI summary keeps only the last 1,500 chars of a gate's output; tools#1198 makes judgeSidecarTree repeat failing findings last. Shard logs: use the GitHub MCP get_job_logs (blob host blocked), tail_lines 20000, then jq .logs_content.

Related: folio-assistant-wmmg.
