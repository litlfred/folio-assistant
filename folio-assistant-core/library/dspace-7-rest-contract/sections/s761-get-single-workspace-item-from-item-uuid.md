---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s761-get-single-workspace-item-from-item-uuid
section_title: "Get Single Workspace Item from Item UUID"
file: "workspaceitems.md"
lines: 172-186
source_sha256: 1bb50597a317b780
granularity: heading
---
## Get Single Workspace Item from Item UUID

**/api/submission/workspaceitems/search/item?uuid=<:item-uuid>**

/server/api/submission/workspaceitems/search/item?uuid=cd67ce0e-7f9a-42fc-b8e7-c8bb83ef58ca
The item uuid is mandatory

There's always at most one workspace item per Item, so this endpoint will return a single workspace item, not a list

It would respond with:
* 200 OK - Returning the workspace item if there's a match
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to view the workspace item
* 204 if the workspace item doesn't exist
