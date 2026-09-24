---
# folio-assistant-61ca
title: 'B5-fix (#1168): a GitHub workflow names the BPMN it implements; 9 <implements workflow> and <job> flipped'
status: in-progress
type: task
priority: high
created_at: 2026-09-24T17:22:12Z
updated_at: 2026-09-24T17:23:46Z
parent: folio-assistant-tr05
---

## Why
9 `<cat-harness.processes:implements workflow=…>` are arrow-direction findings: the diagram names its implementation. Owner decision 2026-09-24: "Workflow names its BPMN".

## Plan
- Each `.github/workflows/*.yml` carries `# bpmn: cat-harness/processes/<x>.bpmn`; each job implementing a node carries `# bpmn-node: <Task_Id>`.
- `check-workflow-coverage.ts`, `prose-code-pairs.ts`, `pair-claims.ts` read the YAML instead of the BPMN.
- Remove the 9 `<implements>` and the `<job>` elements.

## Done when
No `<…:implements>`/`<…:job>` in processes/; coverage and pair checks give the same answers from the YAML; arrow-direction −9.
