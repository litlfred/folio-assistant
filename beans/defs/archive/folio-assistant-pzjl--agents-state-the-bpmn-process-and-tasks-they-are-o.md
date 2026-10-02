---
# folio-assistant-pzjl
title: Agents state the BPMN process and tasks they are operating under
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:37:29Z
---

From #203 comment 5732585369 (2026-09-18 15:55).

> "agents shoudl always indicate the workflow=business process they are on
> if they switch, which Tasks they worked on will work and try to give user
> sense of contexts operating under."

The machinery already exists and is unused in chat: `workflow_next` reports
the enabled step, its lane and its implementing skill, and `crdm-requirements.bpmn`
now carries 13 skill refs so the answer is actionable rather than a bare step
name (PR #241).

What is missing is the REPORTING convention — an agent naming its process and
task in the turn, the way AGENTS.md already requires for beans. Likely a
sibling section to "Say which bean you are on — every turn".
