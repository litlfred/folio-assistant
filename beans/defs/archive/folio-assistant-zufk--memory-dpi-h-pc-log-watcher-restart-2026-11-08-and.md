---
# folio-assistant-zufk
$schema: bean/1.0.0
title: 'Memory: DPI-H PC log watcher restart 2026-11-08 and the user''s rule that format changes are not feedback'
status: completed
type: task
priority: low
created_at: 2026-11-08T06:43:56Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dpi-h-log-watcher-2026-11-07.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DPI-H PC log watcher restart 2026-11-08 and the user's rule that format changes are not feedback

USER RULE (2026-11-08 06:41Z): "format changes dont count, only text comment changes/categorization changes by human". A column rename, a new empty column or a script status string (e.g. Pending -> Not started inside Public Comments) is not feedback, and must not trigger a new proposal.

**Why:** a 5-day watcher stop (11-02 19:36Z to 11-08; an API error cut the turn before the one-shot trigger trig_01DechUHZmPMigmBSvqdDuiu was rescheduled) left 202 DPI-H proposals marked Stale. 201 of them were marked only because new committee columns renamed the headers in the legacy basis hash. Only CS-002 had a human change (TWG (CS) = WHO).

**How to apply:**
- The watcher in /home/claude/watch keeps human-snap.json and flags a row only on human text or categorisation changes.
- Agent - Change Sets G basis is now "2:<hash>" (feedback-issue.ts feedbackBasis with PC_BASIS_GREY on folio-assistant-core main).
- The live script's v2 basis includes grey Public Comments text, so status-string changes can still mark rows Stale there. That conflicts with the user rule and needs a core fix in basisGrey.
- A one-shot watcher must reschedule itself FIRST in each wake.
- Write a "2:<digits>" basis with a leading apostrophe ("'2:245177"). Otherwise Sheets reads it as a time (CS-064 became 4088:17:00 on 2026-11-08 and showed Stale).

- 2026-11-08 11:46Z user "32 A": CS-001 re-pinned to tools 2ea402e (smart-ra#185 head 1bba69aa), preview restaged 8902e46, deployed 12:22Z. Re-pin card closed. Fill card (645 EY-review rows, option B) still open.
