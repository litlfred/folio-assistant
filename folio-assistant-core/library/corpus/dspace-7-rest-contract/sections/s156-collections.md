---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s156-collections
section_title: "Collections"
file: "communities.md"
lines: 97-106
source_sha256: 91351bf44765781b
granularity: heading
---
### Collections
**/api/core/communities/<:uuid>/collections**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/communities/7669c72a-3f2a-451f-a3b9-9210e7a4c02f/collections>

It returns the collections within this community

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
