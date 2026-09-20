---
# folio-assistant-3k08
title: Process state, non-blocking beans, and the swarm-management skill set
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:29:01Z
updated_at: 2026-09-18T17:31:18Z
---

Issue #223 comment 5731729871 (14:48). Three asks:

1. Agents track NESTED state — a task within a process. On exception or falling
   out of process, use context to recover position, then CONFIRM with the user
   that they are back inside the BPMN swimlane guardrails. Update harness skills.
2. When updating bean status, work NON-BLOCKING by default. Only mark blocked
   if truly needed, and then give a timeout/failure so a new agent can take over.
3. Work in parallel through SUB-BEANS, but ask the user explicitly before
   swarming because it costs tokens. A whole separate set of swarm-management
   skills is wanted — model levels, swarm size, CPU — plus a doc page.

Falsifier: if the recovery skill cannot say how an agent DETECTS that it is out
of process, it is an instruction to be careful rather than a procedure, and
will not change behaviour.
