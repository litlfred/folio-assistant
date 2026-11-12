---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s361-workflowitem
section_title: "workflowitem"
file: "pooltasks.md"
lines: 31-35
source_sha256: 77e8609570924138
granularity: heading
---
#### workflowitem
**/api/workflow/pooltasks/<:id>/workflowitem** (READ-ONLY)

It returns the underlying workflowitem holds by the task. See the [workflowitem endpoint for more info](workflowitems.md). This is a **read-only** endpoint, once the task is created the backend workflowitem cannot be changed.
