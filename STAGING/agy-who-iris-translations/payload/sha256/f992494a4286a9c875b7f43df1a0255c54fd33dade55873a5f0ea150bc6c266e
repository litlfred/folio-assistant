---
# folio-assistant-8unf
title: 'SESSION LOGS ARE NOT EPICS: todo-manager and session-intent tell every session to mint a ''Session:'' milestone'
status: completed
type: bug
priority: high
created_at: 2026-10-04T15:09:14Z
updated_at: 2026-10-04T15:30:37Z
parent: folio-assistant-ahvw
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). In qou, 292 of 353 epic-typed beans are 'Session:' logs. Cause: todo-manager Core Directive 1 and session-intent step 4b both say `beans create "Session: <Branch/Goal>" --type milestone`, and the Status Display sample shows `[epic-123] Session: <branch>`. The same skill's §WHICH parent says file by subject, so the skill contradicts itself.

## Done when
- [x] Directive 1 and the sample are rewritten: a session's record is the PR body plus a bean NOTE per bean worked (`beans:note`, keyed by branch), never an epic or milestone
- [x] session-intent step 4b matches
- [x] `bun run health`'s bean-store check reports open Session:/handoff beans typed epic|milestone (report-only)
- [x] skill:register run, gates green


## Summary of Changes
_2026-10-04T15:30:37Z_ — PR #2107. todo-manager Core Directive 1, the Status Display sample and session-intent step 4b no longer mint 'Session:' milestones. A session's record is the PR body plus a bean note keyed by branch. New section todo-manager §'A session is a log, not a parent' gives the qou measurement (292/353). The bean-store health check gains `bean-session-log-roots` (minor, report-only, open beans only; `sessionLogRootBeans` is exported so a restructure plan uses the same definition). BeanEvidence gains `type`. Measured on this store: 0 open.
