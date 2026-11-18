---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s699-get-single-workflow-item-from-item-uuid
section_title: "Get Single Workflow Item from Item UUID"
file: "workflowitems.md"
lines: 129-143
source_sha256: 568b9a61283641e9
granularity: heading
---
## Get Single Workflow Item from Item UUID

**/api/workflow/workflowitems/search/item?uuid=<:item-uuid>**

/api/workflow/workflowitems/search/item?uuid=cd67ce0e-7f9a-42fc-b8e7-c8bb83ef58ca
The item uuid is mandatory

There's always at most one workflow item per Item, so this endpoint will return a single workflow item, not a list

It would respond with:
* 200 OK - Returning the workflow item if there's a match
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to view the workflow item
* 204 if the workflow item doesn't exist
