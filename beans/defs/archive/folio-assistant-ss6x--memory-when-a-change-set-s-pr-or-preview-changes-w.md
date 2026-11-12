---
# folio-assistant-ss6x
$schema: bean/1.0.0
title: 'Memory: When a change set''s PR or preview changes, write the Agent tab row (not only Feedback (agent)) so Staging review/Agentic status update'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:44:27Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-log-preview-columns.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: When a change set's PR or preview changes, write the Agent tab row (not only Feedback (agent)) so Staging review/Agentic status update

User 2026-11-01 21:43Z ("why not column P? Column O was not updated for row 11"): putting the preview link only in Feedback (agent) (M) is not enough. The Contributor Feedback columns N (Agentic status), O (filter) and P (Staging review) are copied by the script from the Agent tab.

**Why:** the user looks in P for the preview and in N/O for status; a stale "#69 (Working)" reads as a stall.

**How to apply:** on every new PR or live preview, write the Agent tab row: C status (Not started/Working/PR open/Ready for review/Change merged/Needs human), D PR URL, G staging review page URL, I built time, J/K head SHA, L "deployed", Q agent step. Then check N:P refreshed on the next poll. HRH Agent tab: CS-007 = row 7. Related: folio-assistant-94i3, folio-assistant-wyqi.
