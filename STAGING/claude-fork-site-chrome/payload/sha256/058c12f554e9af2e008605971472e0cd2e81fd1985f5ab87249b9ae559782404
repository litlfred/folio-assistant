---
# folio-assistant-8qyc
title: 'REGEN DUPLICATED WORK + BARRIERS: skill:register:check re-runs sub-checks regen also asks; un-barrier read-only checks; narrow inputs'
status: in-progress
type: task
priority: high
created_at: 2026-10-05T05:24:07Z
updated_at: 2026-10-05T05:24:22Z
parent: folio-assistant-xpcu
---

## Why
Owner goal 2026-10-05: minimise regen time while staying sound (never a false green). Measured (stream B, main, --jobs 1 --no-cache): 117 pairs, 637 s serial. skill:register:check (107 s, barrier) re-runs ~9 checks regen also asks separately; kg:audit:check (80 s) may be a subset of kg:audit:all:check (198 s); several none/barrier pairs (check:published-instance-exports 49 s, subgraph:jsonld 14.5 s, kg:export 12.6 s, slice:sqlite 11.8 s, kg:locale 7.9 s, render:bpmn 5.4 s) serialize the pool.

## What
1. Remove duplicated work between skill:register:check and regen's own pairs, and between kg:audit and kg:audit:all, keeping every artefact verified every run.
2. Declare outputs: [] in task-io.ts for checks measured read-only.
3. Narrow inputs only where the import closure provably reads only those files.
4. Cheap speed-ups inside the slow checks.

## Done when
- PR from claude/zealous-gates-3o9ma2-io-decls with before/after regen timings (default jobs and --jobs 1, same tree, load noted) and a soundness argument per skip/un-barrier.
- Coordinated with stream C (regen --changed, changed-paths.test.ts): no edits to its --changed logic.

Holder: claude/zealous-gates-3o9ma2-io-decls (session https://claude.ai/code/session_01VfkKocGaQW7Msro2t5S66U), 2026-10-05.
