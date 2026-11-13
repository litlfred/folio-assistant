---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s125-delete-logo
section_title: "Delete Logo"
file: "collections.md"
lines: 252-258
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### Delete Logo
**DELETE /api/core/bitstreams/<:uuid>**

Use the [bitstream delete endpoint](bitstreams.md#delete-method) for removing the collection logo

If the bitstream is delete, this automatically ensures the relationship between the collection and the logo is removed as well.
