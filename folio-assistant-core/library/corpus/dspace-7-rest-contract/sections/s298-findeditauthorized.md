---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s298-findeditauthorized
section_title: "findEditAuthorized"
file: "items.md"
lines: 586-599
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
#### findEditAuthorized
**GET /api/core/items/search/findEditAuthorized**

It returns the list of Items that the current user is authorized to edit

The supported parameters are:
* `query`: limit the returned Items to those with metadata values matching the query terms.
  The query is also used to build a prefix query. It can be used to implement
  an autosuggest feature over the collection name
* `page`, `size` [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeeds
* 401 Unauthorized - if you are not authenticated
