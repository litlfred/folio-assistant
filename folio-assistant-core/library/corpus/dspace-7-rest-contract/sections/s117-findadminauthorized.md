---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s117-findadminauthorized
section_title: "findAdminAuthorized"
file: "collections.md"
lines: 175-189
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### findAdminAuthorized
**/api/core/collections/search/findAdminAuthorized**

Get the list of all collections the current user is admin for.

The supported parameters are:
* `query`: limit the returned collections to those with metadata values matching the query terms.
  The query is also used to build a prefix query. It can be used to implement
  an autosuggest feature over the collection name
* `page`, `size` [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeeds
* 401 Unauthorized - if you are not authenticated
