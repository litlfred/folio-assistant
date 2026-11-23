---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s065-single-bitstream-delete
section_title: "Single Bitstream Delete"
file: "bitstreams.md"
lines: 154-162
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Single Bitstream Delete
Delete a bitstream. Works for normal bitstreams in an Item (bundle), and a community or collection logo

* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not loggedin with sufficient permissions
* 404 Not found - if the bitstream doesn't exist (or was already deleted)
* 422 Unprocessable Entity - if the bitstream is a community or collection logo
