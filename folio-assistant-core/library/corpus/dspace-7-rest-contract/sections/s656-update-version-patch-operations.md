---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s656-update-version-patch-operations
section_title: "Update version (patch operations)"
file: "version.md"
lines: 91-113
source_sha256: 5a33997dae698af1
granularity: heading
---
## Update version (patch operations)

Only the summary property can be updated by item administrators, all the other properties are **READ-ONLY**. Attempt to update any other information will result in a 422 error.

To update the metadata of the corresponding item the appropriate method in the items, workspaceitems or workflowitems endpoints need to be used according to the item status.

**PATCH**

To update the summary property a patch request over the `/summary` path is needed.
According to the [general patch rules](patch.md)
To nullify a summary use the `"op": "remove"` patch operation
To replace an existing summary use the `"op": "replace"` or `"op": "add"` patch operation
To set a summary value when the summary is null use the `"op": "add"` patch operation

For example, `curl -X PATCH http://${dspace.url}/api/versioning/versions/<:id-version> -H "Content-Type: application/json" -d '[{ "op": "add", "path": "/summary", "value": "This is the note related to the version"]'`.  The operation also requires an Authorization header.

Return codes:
* 200 Ok - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the version doesn't exist (or was deleted)
* other error codes according to the [general patch operation rules](patch.md)
