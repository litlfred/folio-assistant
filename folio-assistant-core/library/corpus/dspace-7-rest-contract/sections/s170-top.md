---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s170-top
section_title: "top"
file: "communities.md"
lines: 279-286
source_sha256: 91351bf44765781b
granularity: heading
---
#### top
**/api/core/communities/search/top**

The supported parameters are:
* `page`, `size` [see pagination](README.md#Pagination)

It returns the top level communities in the repository (i.e. the communities that doesn't have a parent)
