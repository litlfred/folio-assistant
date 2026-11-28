---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s115-findsubmitauthorizedbycommunity
section_title: "findSubmitAuthorizedByCommunity"
file: "collections.md"
lines: 139-154
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### findSubmitAuthorizedByCommunity
**/api/core/collections/search/findSubmitAuthorizedByCommunity?uuid=<:uuid>**

The supported parameters are:
* `query`: limit the returned collections to those with metadata values matching the query terms.
  The query is also used to build a prefix query. It can be used to implement
  an autosuggest feature over the collection name
* `page`, `size` [see pagination](README.md#Pagination)
* `uuid`: mandatory, the uuid of the community

It returns the list of collections which are direct children of the specified community where the current user is authorized to submit

Return codes:
* 200 OK - if the operation succeeds
* 400 Bad Request - if the uuid parameter is missing or invalid
