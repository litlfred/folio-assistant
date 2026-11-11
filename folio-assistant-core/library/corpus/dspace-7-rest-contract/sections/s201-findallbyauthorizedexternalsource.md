---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s201-findallbyauthorizedexternalsource
section_title: "findAllByAuthorizedExternalSource"
file: "entitytypes.md"
lines: 111-119
source_sha256: 889b054c4398ad61
granularity: heading
---
#### findAllByAuthorizedExternalSource
**/api/core/entitytypes/search/findAllByAuthorizedExternalSource**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
It returns a list of entity types for which there is at least one collection in which the user is authorized to submit supported by at least one external data source provider

Return codes:
* 200 OK - if the operation succeed
