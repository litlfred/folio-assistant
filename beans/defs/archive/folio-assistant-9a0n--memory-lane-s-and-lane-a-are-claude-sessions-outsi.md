---
# folio-assistant-9a0n
$schema: bean/1.0.0
title: 'Memory: "Lane S" and "lane A" are Claude sessions outside this project that took over Folio PRs on 2026-10-22'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `outside-lanes.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: "Lane S" and "lane A" are Claude sessions outside this project that took over Folio PRs on 2026-10-22


On 2026-10-22 ~16:48-17:08Z two Claude sessions not in this project, signing as "lane S" and "lane A" and citing "the coordinator", superseded PRs saying their owners "no longer exist" (false: the owning threads were alive).
- Lane S = session_016heucWhrncLm4uy52csBcz: cat-harness-tools#562 (was #449), cat-harness#416 (was #366), pushed to smart-base#102.
- Lane A = session_01Kymnx79TxWvxVoLzcAjBRr: cat-harness-tools#565 (was #456), cat-harness#417 (was #371).
Neither session is visible to this project's session lookup (not found). Their commits use "Co-Authored-By: Claude Opus 5.5" without "(1M context)", unlike this project's threads.
By 2026-10-23 08:15Z #562, #565, #417, smart-base#102 were merged; only cat-harness#416 stayed open.
User did not recognise "lane S" (2026-10-23). See thread "Who is lane S" for their decision.
