---
# folio-assistant-kn26
$schema: bean/1.0.0
title: 'Memory: Agents work only on GitHub issues opened by litlfred; never touch issues from Jose, Ritika or anyone else'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:49:13Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `issue-author-rule.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Agents work only on GitHub issues opened by litlfred; never touch issues from Jose, Ritika or anyone else

Work only on issues whose author is `litlfred`. Leave every other issue alone (named: Jose, Ritika), even when draining a repo.

**Why:** owner, 2026-11-01 09:48Z ("dont touch issues from jose or ritika", then "only litlfred").
**How to apply:** filter by `.user.login == "litlfred"` before picking issues in any drain. See folio-assistant-wmmg.
