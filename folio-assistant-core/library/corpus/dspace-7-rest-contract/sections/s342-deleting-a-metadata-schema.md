---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s342-deleting-a-metadata-schema
section_title: "Deleting a Metadata Schema"
file: "metadataschemas.md"
lines: 79-88
source_sha256: 5e66a8afcb205dcc
granularity: heading
---
## Deleting a Metadata Schema

**DELETE /api/core/metadataschemas/<:id>**

Delete a metadata schema.

* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the metadata schema doesn't exist (or was already deleted)
