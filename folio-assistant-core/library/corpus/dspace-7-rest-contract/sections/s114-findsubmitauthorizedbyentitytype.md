---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s114-findsubmitauthorizedbyentitytype
section_title: "findSubmitAuthorizedByEntityType"
file: "collections.md"
lines: 119-138
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### findSubmitAuthorizedByEntityType
**/api/core/collections/search/findSubmitAuthorizedByEntityType?query=<:query>&entityType=<:entityTypeLabel>**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* entityType: mandatory, the label of the entity type  field the collection must have

It returns the list of collections where the current user is authorized to submit and deal with the request entity type

eg:
/api/core/collections/search/findSubmitAuthorizedByEntityType?entityType=<:entityType>
/api/core/collections/search/findSubmitAuthorizedByEntityType?entityType=Publication

retrieve all the collections that deal with the entity type 'Publication'  where the current user is authorized to submit

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the entityType parameter is missing or invalid
