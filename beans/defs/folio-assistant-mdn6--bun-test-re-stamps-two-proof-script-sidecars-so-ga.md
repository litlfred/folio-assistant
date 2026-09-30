---
# folio-assistant-mdn6
title: bun test re-stamps two proof script sidecars, so gates reports the tree changed
status: todo
type: bug
created_at: 2026-09-30T00:40:34Z
updated_at: 2026-09-30T00:40:34Z
parent: folio-assistant-1xhc
---

Measured 2026-09-30 on origin/main 0d2ec884c (worktree for g9r2): every gate passed, then gates.ts failed the run because `bun test` wrote `cat-harness/content/pipeline/script-sidecars/proof-compile-cost.script.json` and `proof-no-cost-regression.script.json`. The diff: `source_file` now reads `folio-assistant-sci/content/pipeline/qa-checkers-cost.ts` (the checker moved there), and `last_run_at`/`last_run_sha` are re-stamped. So the committed sidecars are stale against the move, AND a test writes into the tree under test, which gates.ts calls the defect (bean ymsu). Fix: regenerate and commit the two sidecars; then find the test that writes them and make it compute into a temp dir.
