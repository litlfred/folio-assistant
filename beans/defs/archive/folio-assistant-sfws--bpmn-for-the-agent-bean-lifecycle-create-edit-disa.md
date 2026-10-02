---
# folio-assistant-sfws
title: BPMN for the agent bean lifecycle — create, edit, disable, never delete
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:42:24Z
---

From #203 comment 5731501752 (2026-09-18 14:31).

> "Beans are for the agents to help manage state in a process. need bpmn for
> agents describing when they create/edut/disable(**never delete!**) beans."

Author a BPMN under `processes/` for the AGENT bean lifecycle: when an
agent creates a bean, when it edits one, when it disables one — and **never
deletes**. `beans delete` exists in the CLI, so the prohibition has to be
stated somewhere an agent reads, not merely implied.

Must carry `<folio:skill ref>` per activity and `<folio:bean op>` where it
touches the plan, per AGENTS.md; `check:workflow-refs` gates both.

Note the existing ops the engine already performs are `claim | note |
resolve` — there is no `create` and no `disable`. Reconcile the diagram with
what the engine can actually do, or say plainly which steps are the agent's
own CLI calls rather than engine operations.
