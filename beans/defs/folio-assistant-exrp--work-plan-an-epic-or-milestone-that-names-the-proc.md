---
# folio-assistant-exrp
$schema: bean/1.0.0
title: Work plan = an epic or milestone that names the process it instantiates; approved proposals seed it
status: todo
type: feature
tags:
    - work-plan
created_at: 2026-11-05T06:32:47Z
updated_at: 2026-11-05T06:32:47Z
parent: folio-assistant-rwmf
---

## Asked (owner, 2026-11-05)

"Isn't there the notion of an MVP or epics or milestones.... That have beans. These are work plans, no?" and "At the beginning of a large process (like creating a new collaborative document, or adding software features,) there should / may be a work plan. Not every process needs a work plan. Docs/proposals/ once approved become workplans."

Card answered: **"Epic is the plan"**: an epic or milestone work item IS the work plan; it names the process it instantiates; the proposal stays a separate document, linked from the epic.

## What is known (analysis 2026-11-04)

- 9 epics, 1 milestone; they group work items by `parent` but name no process.
- An instance links to ONE work item (`bean`, `carriedBeans`); nothing ties instances to a plan.
- `content-lifecycle.bpmn` has "Seed the work plan" after "Plan scope, team, artifacts"; its output is not a node.
- `docs/proposals/` status is free prose; nothing marks one approved.

## Plan

1. bean/1.0.0 (minor bump): optional `process` (the BPMN process an epic/milestone instantiates) and `proposal` (repo-relative path) on a plan-type work item; a work item that has them IS a work plan.
2. Instance: optional `plan: <work item id>`; `workflow_start(process, subject, bean?, plan?)`.
3. A process declares whether it starts from a plan (optional; small processes need none).
4. Proposal lifecycle: approval of a proposal seeds (or names) its epic.
5. Skills: todo-manager / work-plan-store / glossary term "Work plan".

## Not doing

A separate work-plan node; renaming identifiers.
