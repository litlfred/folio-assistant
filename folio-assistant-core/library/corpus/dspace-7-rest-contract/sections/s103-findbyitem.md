---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s103-findbyitem
section_title: "findByItem"
file: "claimedtasks.md"
lines: 76-90
source_sha256: bffc31e318cbb41a
granularity: heading
---
#### findByItem
**/api/workflow/claimedtasks/search/findByItem?uuid=<:item-uuid>**
It returns, if any, the single task related to the specified item claimed by the current user

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the item object

Return codes:
* 200 OK - if the operation succeed
* 204 No Content - if there is no claimed task for the specified item and the current user
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 422 Unprocessable Entity - if the provided uuid cannot be resolved to an item regardless to the item status
