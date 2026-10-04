---
# folio-assistant-8unf
title: 'SESSION LOGS ARE NOT EPICS: todo-manager and session-intent tell every session to mint a ''Session:'' milestone'
status: in-progress
type: bug
priority: high
created_at: 2026-10-04T15:09:14Z
updated_at: 2026-10-04T15:10:22Z
parent: folio-assistant-ahvw
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). In qou, 292 of 353 epic-typed beans are 'Session:' logs. Cause: todo-manager Core Directive 1 and session-intent step 4b both say `beans create "Session: <Branch/Goal>" --type milestone`, and the Status Display sample shows `[epic-123] Session: <branch>`. The same skill's §WHICH parent says file by subject, so the skill contradicts itself.

## Done when
- [ ] Directive 1 and the sample are rewritten: a session's record is the PR body plus a bean NOTE per bean worked (`beans:note`, keyed by branch), never an epic or milestone
- [ ] session-intent step 4b matches
- [ ] `bun run health`'s bean-store check reports open Session:/handoff beans typed epic|milestone (report-only)
- [ ] skill:register run, gates green
