---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s063-byitemhandle
section_title: "byItemHandle"
file: "bitstreams.md"
lines: 133-151
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### byItemHandle
**/api/core/bitstreams/search/byItemHandle?handle=<:prefix>/<:suffix>&sequence=<:sequence_id>&filename=<:filename>**

It returns the bitstream matching the given parameters, or an empty response

The supported parameters are:
* `handle`: mandatory, the item's handle
* `sequence`: optional, the bitstream's sequence ID
* `filename`: optional, the bitstream's file name
* either `sequence` or `filename` should be present

Return codes:
* 200 OK - if the operation succeed. This will contain the bitstream
* 204 No Content - if there is no bitstream matching the given parameters
* 400 Bad Request - if neither `sequence` nor `filename` is present
* 401 Unauthorized - if you are not authenticated and the bitstream metadata is not public
* 403 Forbidden - if you are not logged in with sufficient permissions to see the bitstream metadata
* 422 Unprocessable Entity - if the provided uuid cannot be resolved to an item regardless to the item status
