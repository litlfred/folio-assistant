---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s254-findbyentitytype
section_title: "findByEntityType"
file: "external-authority-sources.md"
lines: 302-312
source_sha256: 669cf312a4da728a
granularity: heading
---
#### findByEntityType
**/api/integration/externalsources/search/findByEntityType?entityType=<:type-label>**

The supported parameters are:
* entityType (mandatory) the label of the entity type
* page, size [see pagination](README.md#Pagination)
It returns a list of external sources that support the requested entity type

Return codes:
* 200 OK - if the operation succeed, a 0 size list can be returned
* 400 Bad Request - if the entityType parameter is missing
