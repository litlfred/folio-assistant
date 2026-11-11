---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s178-deleting-a-community
section_title: "Deleting a community"
file: "communities.md"
lines: 423-433
source_sha256: 91351bf44765781b
granularity: heading
---
## Deleting a community

**DELETE /api/core/communities/<:uuid>**

Delete a community.

* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the community doesn't exist (or was already deleted)
