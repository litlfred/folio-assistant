---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s116-findsubmitauthorizedbycommunityandentitytype
section_title: "findSubmitAuthorizedByCommunityAndEntityType"
file: "collections.md"
lines: 155-174
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### findSubmitAuthorizedByCommunityAndEntityType
**/api/core/collections/search/findSubmitAuthorizedByCommunityAndEntityType?uuid=<:uuid>&query=<:query>&entityType=<:entityTypeLabel>**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the community
* entityType: mandatory, the label of the entity type field the collection must have

It returns the list of collections where the current user is authorized to submit and deal with the request entity type

eg:
/api/core/collections/search/findSubmitAuthorizedByCommunityAndEntityType?uuid=<:uuid>&entityType=<:entityType>
/api/core/collections/search/findSubmitAuthorizedByCommunityAndEntityType?uuid=<:uuid>&entityType=Publication

retrieve all children collections of the community that deal with the entity type 'Publication' where the current user is authorized to submit

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the uuid or entityType parameters are missing or invalid
