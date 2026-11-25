---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s136-parent-community
section_title: "Parent Community"
file: "collections.md"
lines: 522-534
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### Parent Community
**/api/core/collections/<:uuid>/parentCommunity**

It returns the community containing this collection, e.g. for trail purposes.  
If a collection is part of multiple parent communities, it only returns one community.

Return codes:
* 200 OK - if the parent community exists and returned
* 204 No content - if the collection exists but the parent community doesn't exist
* 401 Unauthorized - if you are not authenticated and the current collection or parent community is not public
* 403 Forbidden - if you are not logged in with sufficient permissions to retrieve the current collection or parent community
* 404 Not found - if the current collection doesn't exist
