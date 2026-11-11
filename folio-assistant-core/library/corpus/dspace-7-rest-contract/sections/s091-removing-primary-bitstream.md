---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s091-removing-primary-bitstream
section_title: "Removing Primary bitstream"
file: "bundles.md"
lines: 341-354
source_sha256: 83759dccfb9965fd
granularity: heading
---
### Removing Primary bitstream

If the Primary bitstream already exists, and no primary bitstream should be used anymore, it can be changed using a DELETE. This will **not** delete the bitstream nor unassign it from the bundle, it will just ensure the bundle has no primary bitstream anymore

**DELETE /api/core/bundles/<:uuid>/primaryBitstream**

This should not have any content

Status codes:
* 204 No Content - if the operation succeeded
* 400 Bad Request - if there was no primary bitstream
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bundle doesn't exist
