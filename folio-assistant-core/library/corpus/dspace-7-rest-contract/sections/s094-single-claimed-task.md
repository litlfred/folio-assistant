---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s094-single-claimed-task
section_title: "Single Claimed Task"
file: "claimedtasks.md"
lines: 9-28
source_sha256: bffc31e318cbb41a
granularity: heading
---
## Single Claimed Task
**/api/workflow/claimedtasks/<:id>**

Provide details about a specific task in the pool. The JSON response document is as follow

```json
{
    "id": 1,
    "step": "editstep",
    "action": "editaction",
    "type": "claimedtask"
}
```

Exposed links:
* step: the workflow step
* action: the workflow action
* workflowitem: the workflowitem underlying the task
* owner: the eperson that own the task
