---
# folio-assistant-r5oj
$schema: bean/1.0.0
title: 'Memory: When merging main into an fa branch, resolve index.config.json/index.lock.json per instance, never whole-file --ours'
status: completed
type: task
priority: low
created_at: 2026-10-31T19:20:57Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pin-conflict-resolution.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: When merging main into an fa branch, resolve index.config.json/index.lock.json per instance, never whole-file --ours


When merging main into an fa branch, a conflict in index.config.json or index.lock.json must be resolved one instance at a time. For each instance, keep whichever pin is newer. Never take a whole file with `git checkout --ours`.

**Why:** on 2026-10-31, fa#2847's merge (d0c9151) kept the branch's whole files. That rolled the cat-harness pin back to 9846173 and bootstrap-tools back to 431b4bc, undoing fa#2855. The rollback had to be repaired by fa#2862.

**How to apply:** after resolving, diff every instance's ref/sha against origin/main (`git diff origin/main -- index.*.json`). Each instance must be equal to or ahead of main's pin. Check this again just before merging.

See folio-assistant-wmmg.
