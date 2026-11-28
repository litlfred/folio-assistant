---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s061-main-thumbnail
section_title: "Main Thumbnail"
file: "bitstreams.md"
lines: 119-131
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Main Thumbnail
**/api/core/bitstreams/<:uuid>/thumbnail**

It returns the bitstream which represents the thumbnail of the specified bitstream.  
At this time, thumbnails are only supported for bitstreams in the `ORIGINAL` bundle.

Status codes:
* 200 OK - returning the thumbnail
* 204 No Content - if there is no thumbnail for the specified bitstream
* 401 Unauthorized - if you are not authenticated and don't have permissions on the bitstream or the thumbnail's metadata
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bitstream doesn't exist
