---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s113-findsubmitauthorized
section_title: "findSubmitAuthorized"
file: "collections.md"
lines: 105-118
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### findSubmitAuthorized
**/api/core/collections/search/findSubmitAuthorized**

The supported parameters are:
* `query`: limit the returned collections to those with metadata values matching the query terms.
  The query is also used to build a prefix query. It can be used to implement
  an autosuggest feature over the collection name
* `page`, `size` [see pagination](README.md#Pagination)

It returns the list of collections where the current user is authorized to submit

Return codes:
* 200 OK - if the operation succeeds
