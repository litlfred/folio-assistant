---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s168-delete-the-community-administrators-group
section_title: "Delete the Community administrators group"
file: "communities.md"
lines: 267-277
source_sha256: 91351bf44765781b
granularity: heading
---
##### Delete the Community administrators group
**DELETE /api/core/communities/<:uuid>/adminGroup**

To be used on a community with an administrator group

Status codes:
* 204 No content - if the delete succeeded (including the case of no-op if the community didn't contain an administrator group) 
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only admins and (parent) community admins can delete the group
* 404 Not found - if the community doesn't exist
