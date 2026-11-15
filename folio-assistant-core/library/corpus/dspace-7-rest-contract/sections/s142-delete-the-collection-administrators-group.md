---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s142-delete-the-collection-administrators-group
section_title: "Delete the collection administrators group"
file: "collections.md"
lines: 601-612
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
##### Delete the collection administrators group
**DELETE /api/core/collections/<:uuid>/adminGroup**

To be used on a collection with an administrator group

Status codes:
* 204 No content - if the delete succeeded (including the case of no-op if the collection didn't contain an administrator group) 
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only admins, parent community admins and collection admins can delete the group
* 404 Not found - if the collection doesn't exist
* 422: if the collection didn't contain an administrator group
