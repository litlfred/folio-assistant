---
# folio-assistant-07xs
title: 'MOVE: skills/memory/ out to a declared memory/ directory'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T05:35:24Z
updated_at: 2026-09-20T08:02:20Z
parent: folio-assistant-zzmr
---

The relocation bean/mhh9's ruling implies. Agent memory is `context` (static state read during a process, never written by one); `skills/memory/` sits inside `skills/`, declared `cat-harness` (content). A SECOND declaration inside the first is the nesting defect #263 names, so the fix is a move to a declared top-level `memory/`. Held back from the classification PR deliberately: relocating a directory as a side effect of another change is the shape #395 refused and bean `auap` did as its own change (PR #400). Blast radius measured 2026-09-20: 36 nodes, 34 references across 11 files, most of them COMMENTS explaining why memory is excluded from skill scans. The one real resolver is MEMORY_DIRS in scripts/agent-memory.ts, already declaration-driven as kgRoots(ROOT).map(d => join(d, 'memory')) — which stops finding it, since kgRoots filters to exactly-`cat-harness`. Also: the generated header line in agent-memory.ts, the code-quality-gates.yml comment, todos/todos.json prose, and skill-coverage/tools tests.
