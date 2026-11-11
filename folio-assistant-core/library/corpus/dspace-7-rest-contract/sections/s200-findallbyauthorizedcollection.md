---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s200-findallbyauthorizedcollection
section_title: "findAllByAuthorizedCollection"
file: "entitytypes.md"
lines: 101-110
source_sha256: 889b054c4398ad61
granularity: heading
---
#### findAllByAuthorizedCollection
**/api/core/entitytypes/search/findAllByAuthorizedCollection**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
It returns a list of entity types for which there is at least one collection in which the user is authorized to submit

Return codes:
* 200 OK - if the operation succeed
