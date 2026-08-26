---
# folio-assistant-dv3w
title: Close the beans <-> workflow-instance loop (phase 2)
status: todo
type: task
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T15:29:15Z
---

Follow-up to fq0b. .beans/ answers 'what is being worked on'; a workflow instance answers 'where did it get to'. Those must be one answer or they will diverge. Hooks exist already: workflow_start takes a bean, and 11 activities carry <folio:bean/>. What is missing is the loop closing — completing a bean-marked activity updates the bean, and work_plan_prime reports instance position beside bean status. Small, and independent of the gating decision. See docs/proposals/workflow-orchestration.md §5.
