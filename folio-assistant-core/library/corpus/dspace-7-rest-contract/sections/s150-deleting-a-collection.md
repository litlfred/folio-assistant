---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s150-deleting-a-collection
section_title: "Deleting a collection"
file: "collections.md"
lines: 730-739
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
## Deleting a collection

**DELETE /api/core/collections/<:uuid>**

Delete a collection.

* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the collection doesn't exist (or was already deleted)
