---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s359-single-pool-task
section_title: "Single Pool Task"
file: "pooltasks.md"
lines: 9-29
source_sha256: 77e8609570924138
granularity: heading
---
## Single Pool Task
**/api/workflow/pooltasks/<:id>**

Provide details about a specific task in the pool. The JSON response document is as follow

```json
{
    "id": 1,
    "step": "editstep",
    "action": "claimaction",
    "type": "pooltask"
}
```

Exposed links:
* step: the workflow step
* action: the workflow action
* workflowitem: the workflowitem underlying the task
* eperson: the eperson that can claim the task
* group: the group that can claim the task
