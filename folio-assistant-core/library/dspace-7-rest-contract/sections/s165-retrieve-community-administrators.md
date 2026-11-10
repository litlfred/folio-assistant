---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s165-retrieve-community-administrators
section_title: "Retrieve Community administrators"
file: "communities.md"
lines: 215-228
source_sha256: 91351bf44765781b
granularity: heading
---
##### Retrieve Community administrators
**GET /api/core/communities/<:uuid>/adminGroup**

Example: /server/api/core/communities/7669c72a-3f2a-451f-a3b9-9210e7a4c02f/adminGroup

It returns the EPerson Group representing the administrators of this community. [See the EPerson Group endpoint for more info](epersongroups.md#single-eperson-group)

Return codes:
* 200 OK - if the admin group exists and is returned
* 204 No content - if the current community exists but the admin group doesn't exist
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to retrieve the groups. Only admins and (parent) community admins can retrieve the group
* 404 Not found - if the current community doesn't exist
