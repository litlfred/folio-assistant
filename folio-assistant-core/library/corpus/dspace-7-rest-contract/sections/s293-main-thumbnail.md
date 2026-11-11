---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s293-main-thumbnail
section_title: "Main Thumbnail"
file: "items.md"
lines: 508-519
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Main Thumbnail
**/api/core/items/<:uuid>/thumbnail**

It returns the bitstream which represents the main thumbnail of the item

Status codes:
* 200 OK - returning the thumbnail
* 204 No Content - if there is no thumbnail for the specified item
* 401 Unauthorized - if you are not authenticated and don't have permissions on the item or the thumbnail's metadata
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the item doesn't exist
