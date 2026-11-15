---
# folio-assistant-swl0
$schema: bean/1.0.0
title: 'Memory: Sibling threads/subagents must hand every card, question, result or blocker back to the discussion agent (skill hand-back-to-discussion), never leave...'
status: completed
type: task
priority: low
created_at: 2026-10-31T15:51:37Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `sibling-hand-back.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Sibling threads/subagents must hand every card, question, result or blocker back to the discussion agent (skill hand-back-to-discussion), never leave it only in their own thread.


When an agent is spawned during a live discussion with the user, every card, question, decision, result or blocker it has goes back to the agent talking with the user. It is also posted in the helper's own thread, but never only there. Review sheets and issues are extra channels, never the only one. Once answered, the chat copy is struck through and gets "[Edit: …]". The answer is routed back to the helper with the user's message attached by id.

**Why:** On 2026-10-31 sibling threads posted cards only in their own thread and the coordinator had to relay them by hand. The user asked for the process and skills to be updated (cmsg_017WNUkNK8kdDziPK58Pv6G9YHfWs7UzP75QkLz2EHMgaK).

**How to apply:** Follow cat-harness skill `conduct/conduct-core/hand-back-to-discussion` (schemas in `schemas/skills/hand-back-to-discussion/`, process `Process_HandBackToDiscussion`). A brief that spawns a thread names the discussion agent and any sheet in play. Merged 2026-10-31: cat-harness#862 (also wires a "Talking with the person?" gateway into ask-the-person.bpmn) and folio-assistant-core#434. See folio-assistant-wmmg.
