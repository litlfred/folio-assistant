---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s206-deleting-an-eperson-group
section_title: "Deleting an EPerson Group"
file: "epersongroups.md"
lines: 65-77
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
## Deleting an EPerson Group

**DELETE /api/eperson/groups/<:uuid>**

Deletes the EPerson Group

Status codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions, only general admins can delete a group
* 404 Not found - if the Group doesn't exist (or was already deleted)
* 422 Unprocessable Entity - if you attempt to delete a permanent group or a group that has a parent (community admins, collection submitters, ... these have separate endpoints to delete them)
