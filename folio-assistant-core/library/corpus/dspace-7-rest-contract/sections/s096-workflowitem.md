---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s096-workflowitem
section_title: "workflowitem"
file: "claimedtasks.md"
lines: 30-34
source_sha256: bffc31e318cbb41a
granularity: heading
---
#### workflowitem
**/api/workflow/claimedtasks/<:id>/workflowitem** (READ-ONLY)

It returns the underlying workflowitem holds by the task. See the [workflowitem endpoint for more info](workflowitems.md). This is a **read-only** endpoint, once the task is created the backend workflowitem cannot be changed.
