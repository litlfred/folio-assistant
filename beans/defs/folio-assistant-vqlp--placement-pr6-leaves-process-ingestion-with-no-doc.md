---
# folio-assistant-vqlp
title: 'Placement PR6 leaves Process_Ingestion with no docs page section, so the harness''s own basic flow has no KG witness'
status: todo
type: task
priority: normal
created_at: 2026-10-04T09:08:33Z
updated_at: 2026-10-04T09:08:33Z
---
#1898 repoints `content/docs/document-ingestion/nodes/the-pipeline.jsonld`'s `sourceDocument` from `cat-harness/processes/library/document-ingestion.bpmn` to `folio-assistant-core/processes/library/l1-document-ingestion.bpmn`. That is deliberate and the prose was rewritten to match. The side effect is not: the harness's own basic flow, which the PR says STAYS in the harness, is then presented by no page section.

Measured on the branch head:
- `docs/processes/document-ingestion.md` says "**Presented on:** no docs page section shows this diagram"; on main it says "[Document ingestion - The pipeline](../document-ingestion.html#the-pipeline)".
- Process node pages carrying that line: 71 on main, 72 on the branch. The one added is Process_Ingestion.
- No witness bundle in the tree has subject `Process_Ingestion` (21 bundles checked), so the flow has no KG evidence and `kg:audit` still exits 0 - it lands silently.

NO NEW BPMN IS NEEDED. `cat-harness/processes/library/document-ingestion.bpmn` exists, defines `Process_Ingestion`, documents its lanes and roles, carries the "THE ID Process_Ingestion IS KEPT ON PURPOSE" note, and its SVG is already rendered at `assets/img/workflows/document-ingestion.svg`. What is missing is an authored Figure node that presents it.

## Done when
- [ ] a Figure node in `cat-harness/content/docs/document-ingestion/` has `sourceDocument` = `cat-harness/processes/library/document-ingestion.bpmn`, ordered BEFORE `the-pipeline` so the page reads basic-flow-then-refinement
- [ ] `docs/processes/document-ingestion.md` names a presenting section again
- [ ] a witness bundle exists with subject `Process_Ingestion`
- [ ] the unpresented-diagram count is back to 71
