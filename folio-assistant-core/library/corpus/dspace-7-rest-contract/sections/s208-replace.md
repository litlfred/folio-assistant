---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s208-replace
section_title: "Replace"
file: "epersongroups.md"
lines: 85-98
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Replace
The replace operation allows to replace *existent* information with new one.
The only property which can be modified is the group name.

To change the name of an EPerson Group, use
`curl --data '[ { "op": "replace", "path": "/name", "value": "New Name"}]' -H "Authorization: Bearer ..." -H "content-type: application/json" -X PATCH ${dspace7-url}/api//eperson/groups/${group-uuid}`.

Status codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions, only general admins can patch a group
* 404 Not found - if the Group doesn't exist (or was already deleted)
* 422 Unprocessable Entity - if the name cannot be modified (e.g. if permanent was set to true or the group is part of a DSpace Object)
