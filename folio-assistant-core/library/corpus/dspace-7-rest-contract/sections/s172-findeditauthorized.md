---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s172-findeditauthorized
section_title: "findEditAuthorized"
file: "communities.md"
lines: 302-316
source_sha256: 91351bf44765781b
granularity: heading
---
#### findEditAuthorized
**/api/core/communities/search/findEditAuthorized**

Get the list of all communities the current user is authorized to edit.

The supported parameters are:
* `query`: limit the returned communities to those with metadata values matching the query terms.
  The query is also used to build a prefix query. It can be used to implement
  an autosuggest feature over the community name
* `page`, `size` [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeeds
* 401 Unauthorized - if you are not authenticated
