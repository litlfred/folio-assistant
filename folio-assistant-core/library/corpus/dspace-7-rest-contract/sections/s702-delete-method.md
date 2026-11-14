---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s702-delete-method
section_title: "DELETE Method"
file: "workflowitems.md"
lines: 167-178
source_sha256: 568b9a61283641e9
granularity: heading
---
## DELETE Method
**DELETE /api/workflow/workflowitems/<:id>**

Reset a workflow sending back the item to the workspace regardless to the step reached.

If an optional parameter `?expunge=true` is included, the workflow item is deleted instead of being returned to the workflow.

It would respond with:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in as an administrator
* 404 Not found - if the workflow doesn't exist
