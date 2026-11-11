---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s139-retrieve-collection-administrators
section_title: "Retrieve collection administrators"
file: "collections.md"
lines: 549-562
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
##### Retrieve collection administrators
**GET /api/core/collections/<:uuid>/adminGroup**

Example: /server/api/core/collections/7669c72a-3f2a-451f-a3b9-9210e7a4c02f/adminGroup

It returns the EPerson Group representing the administrators of this collection. [See the EPerson Group endpoint for more info](epersongroups.md#single-eperson-group)

Return codes:
* 200 OK - if the admin group exists and is returned
* 204 No content - if the current collection exists but the admin group doesn't exist
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to retrieve the groups, parent community admins and collection admins can retrieve the group
* 404 Not found - if the current collection doesn't exist
