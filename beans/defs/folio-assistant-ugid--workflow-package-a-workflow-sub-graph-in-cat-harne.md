---
# folio-assistant-ugid
title: 'WORKFLOW PACKAGE: a workflow/ sub-graph in cat-harness gathering the BPMN skills and the engine as a Tool'
status: todo
type: feature
priority: high
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T05:04:25Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20: 'just like there is a kg-navigation sub-graph there, there should be a workflow/ sub-graph which brings together skills/tools around bpmn navigation and workflow management, expectation on use of beans and todos to reference state'. The engine is BUILT — issue #200, phases 1-3 landed, DMN shipped: src/workflow/{process-model,gate,decision-table,instance,store,bean-link}.ts. What is missing is a home. The skills are scattered across skills/folio-core/ (bpmn-processes, process-state, bean-blocking, todo-manager) and the engine is declared as a Tool NOWHERE — it is code nothing in the graph points at.
