---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s294-get-single-version-for-item
section_title: "Get single version for item"
file: "items.md"
lines: 520-532
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Get single version for item
**GET /api/core/items/{:item-uuid}/version**

Provide version information based on a given Item UUID. An Item UUID will only match one version. READ permissions over the item in addition to the version permissions are checked.
The JSON response is the same as the [Version endpoint](version.md#get-single-version).

Return codes:
* 200 OK - if the operation succeeds
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
* 204 No Content - if the specified item is not yet versioned
* 400 Bad Request - if the item id param is missing or invalid (not an uuid)
