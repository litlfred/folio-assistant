---
# folio-assistant-ubym
$schema: bean/1.0.0
title: 'Memory: Fix for check:corpus-gate failing on every change-set PR (dth-hrh CS PRs), Q-GATE-1 A, tools#1329, open Q-GATE-2'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:31:46Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `corpus-gate-change-sets.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Fix for check:corpus-gate failing on every change-set PR (dth-hrh CS PRs), Q-GATE-1 A, tools#1329, open Q-GATE-2


Thread "Fix the corpus gate on content PRs" (cmsg_017WNUkNK8kdDziPK58Pv6G9BMMNFQ4yKq4NThjCE8sb8T), 2026-11-01.
- Cause: the gate (cat-harness-tools src/workflow/corpus-gate.ts) wanted one editing-hci-validation (Process_Editing) instance per changed block at Task_Commit. That process has 3 person-lane steps per block, so agents can't satisfy it.
- Q-GATE-1 A (user tap 20:30Z): recognise the change-set route. tools#1329 (issue #1328): a block passes when a RUNNING content-change-review instance, committed in the SAME diff, lists it in new `scope.blocks` and has finished Call_MakeChange. CLI: `workflow-cli.ts scope <id> --change-set CS-NNN --blocks a,b`. Functional, so it may merge on green inside the window.
- Q-GATE-2 B (user tap 20:33Z): the user taps one card per change set to record Task_DescribeChange (Content Author lane), then the agent records the content-change-review instance + scope on that CS PR.
- Afterwards: record instances on the CS-014..019 drafts. Never merge content or committee PRs.
- User 20:33Z (cmsg_017WNUkNK8kdDziPK58Pv6G9EtxbFNXzg4B6zu7rvfVUYK): "i can tap card or committe can mark it ready for merge in google sheet... different tools same skill". A person step may be recorded from EITHER a card tap OR a person's review-sheet cell (Ready for agent: Yes = describe; committee Ready for merge = approval). The agent records it citing the source; never on its own say-so.
- dth-hrh CS PRs: CS-014 #70, CS-015 #81, CS-016 #82, CS-017 #83, CS-018 #85, CS-019 #87 (owner: HRH split thread; all committee content, never merge). Watcher 20:34Z: "Ready for agent" = Yes already on CS-007/013/014/016/017/018 (seen 19:49-20:01Z; Sheets API gives no editor name); Ready for merge No on all. So CS-015 and CS-019 need a card tap for the describe step. dth-hrh pins tools 6417b9d, so it needs a re-pin after #1329 merges.
- User 20:34Z: "i am wearing many hats, editor and programmer and contributor". One person, many roles: record their tap or cell against the role the step's lane needs (author, editor, contributor), and name that role in the record.
