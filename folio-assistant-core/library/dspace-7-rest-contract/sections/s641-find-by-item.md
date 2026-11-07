---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s641-find-by-item
section_title: "Find by Item"
file: "supervisionorders.md"
lines: 44-57
source_sha256: 7ac02348ade76459
granularity: heading
---
### Find by Item
**/api/core/supervisionorders/search/byItem?uuid=<:item-uuid1>**

This method returns a list of supervision orders defined for an item whose uuid is passed as parameter to the query

The supported parameters are:
* uuid: mandatory. The uuid of the item for which supervision order must be found

 
Return codes:
* 200 OK - if the operation succeed. Including the case where item exists but does not have any supervision order defined.
* 400 Bad Request - if uuid parameter is missing or syntactically invalid (not an uuid) 
* 404 Not found - if no items are found for the uuid..
