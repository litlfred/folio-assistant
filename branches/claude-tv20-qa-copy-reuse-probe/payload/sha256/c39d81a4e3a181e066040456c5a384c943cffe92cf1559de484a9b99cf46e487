---
# folio-assistant-rwhr
$schema: bean/1.0.0
title: 'A process declares whether it starts from a work plan; workflow_start says so when one is missing'
status: completed
type: feature
parent: folio-assistant-rwmf
priority: normal
created_at: 2026-11-05T20:10:15Z
updated_at: 2026-11-06T09:53:20Z
---
Split from folio-assistant-exrp (plan step 3), owner 2026-11-05: not chosen for now; filed as its own work item. A BPMN process declares (optionally) that it starts from a work plan; small processes need none. workflow_start reports, without refusing, when such a process is started with no plan.

_2026-11-06T08:35:21Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-06T09:53:20Z_ — Completed in `litlfred/cat-harness-tools#1586`: `loadProcessModel` reads optional `startsFromWorkPlan` from `<bpmn:process>` (`<cat-harness.processes:work-plan/>` / `starts="true|false"` / `<cat-harness.processes:policy workPlan="true|false"/>`), and `workflow_start` (`workflowStartAnswer`) reports — without refusing — when a process declaring `startsFromWorkPlan` is started with no `plan` and no `bean`.
