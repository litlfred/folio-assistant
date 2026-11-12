---
# folio-assistant-ubrt
$schema: bean/1.0.0
title: 'Memory: Claude sessions'' auto-mode safety check blocks PR merges and issue closes even inside the owner''s merge windows'
status: completed
type: task
priority: low
created_at: 2026-10-30T17:30:34Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `merge-safety-check.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Claude sessions' auto-mode safety check blocks PR merges and issue closes even inside the owner's merge windows


Seen 2026-10-30 in the "Fix publish failure and orphan beans" and CI threads: the session safety check refused `gh api .../merge` ("Merge Without Review") and closing an issue, although the owner's merge window and "merge all ready" rule were in force. Threads now ask the owner on a card for each batch of merges/closes, listing every PR and issue.

**Why:** a relayed merge window is not the owner's own approval in that thread.
**How to apply:** batch merges and closes into one card per thread with the full list; don't retry or route around a refusal. See folio-assistant-wmmg.
