---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s099-workflow-action
section_title: "workflow action"
file: "claimedtasks.md"
lines: 47-53
source_sha256: bffc31e318cbb41a
granularity: heading
---
#### workflow action
**/api/workflow/claimedtasks/<:id>/action** (READ-ONLY)

It returns the workflow action currently assigned to the task.
See the [workflow actions](workflowactions.md) endpoint for more info.
This is a **read-only** endpoint, the [POST to the claimed task](#post-method-single-resource-level) is used to perform the action
