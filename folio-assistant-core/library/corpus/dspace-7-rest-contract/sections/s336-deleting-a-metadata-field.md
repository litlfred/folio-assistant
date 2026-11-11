---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s336-deleting-a-metadata-field
section_title: "Deleting a Metadata Field"
file: "metadatafields.md"
lines: 116-125
source_sha256: c6cc6468c8c0f419
granularity: heading
---
## Deleting a Metadata Field

**DELETE /api/core/metadatafields/<:id>**

Delete a metadata field.

* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the metadata field doesn't exist (or was already deleted)
