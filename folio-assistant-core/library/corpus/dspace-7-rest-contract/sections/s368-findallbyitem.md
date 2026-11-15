---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s368-findallbyitem
section_title: "findAllByItem"
file: "pooltasks.md"
lines: 66-81
source_sha256: 77e8609570924138
granularity: heading
---
#### findAllByItem
**/api/workflow/pooltasks/search/findAllByItem?uuid=<:item-uuid>**
Accessible only by Admin
It returns all the pool tasks related to the specified item

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the item object

Return codes:
* 200 OK - if the operation succeed. This include the case of no matching tasks where a 0-size page json representation is returned.
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only users with ADMIN right can use the endpoint
* 422 Unprocessable Entity - if the provided uuid cannot be resolved to an item regardless to the item status
