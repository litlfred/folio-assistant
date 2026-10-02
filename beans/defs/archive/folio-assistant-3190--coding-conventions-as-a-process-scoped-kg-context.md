---
# folio-assistant-3190
title: Coding conventions as a process-scoped KG context kind
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:22:06Z
updated_at: 2026-09-20T06:31:51Z
parent: folio-assistant-ahvw
---


## The requirement, in the author's words (2026-09-18)

> coding conventions should also be part of KG. its a specific type of context
> that should be set depending on the process/workflow (e.g. in software
> development under CRDM) but not all contexts should have it.

## Why it is not just "more AGENTS.md"

`AGENTS.md` opens by saying it is a bootstrap pointer and that a rule living
only there is a rule with no home — not in the generated reference, not in the
published skill docs, and not found by an agent that went looking for the skill
first. Coding conventions are today exactly that: prose in `AGENTS.md` and in
scattered skills, loaded unconditionally regardless of what the agent is doing.

The author's point is sharper than "move it to a skill": a coding convention is
**context attached to a process**, so an agent inside `crdm-requirements`
Phase 6 (implement) has it and an agent adjudicating a translation does not.
That is the same scoping the subprocess stack already gives roles — an actor
keeps the outer role and takes on the inner lane's, and the skills are the
union along that call path. Conventions should resolve the same way.

## Sketch

- A `convention` node kind in the `kg` graph, beside skills and roles.
- A BPMN extension binding it to a process, a lane or an activity — the
  `<folio:skill ref>` pattern, for conventions.
- `workflow_next` returns the conventions in force at the current step, the way
  it already returns the skill that implements it.
- Absent binding means **no conventions**, not all of them: a convention that
  fires everywhere is the unconditional prose this bean exists to replace.

## Done when

- A convention is a declared KG node with a title and description
  (`KG_NODE_LABEL_FIELDS`).
- At least one process binds one, and `workflow_next` reports it.
- `kg:audit` has a criterion for the binding, at a severity that does not gate
  on absence — most steps legitimately carry none.

## Related

`wwbl` (audit: which skills are not in the KG) is the other half of the same
ask and should land alongside or before this.
