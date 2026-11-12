---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s430-deleting-a-resource-policy
section_title: "Deleting a resource policy"
file: "resourcepolicies.md"
lines: 309-318
source_sha256: 36a99f15a2026313
granularity: heading
---
## Deleting a resource policy
**DELETE /api/authz/resourcepolicies/<:id>**

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or user with ADMIN permission over the target resource can use the endpoint
* 404 Not found - if the item doesn't exist (or was already deleted)
