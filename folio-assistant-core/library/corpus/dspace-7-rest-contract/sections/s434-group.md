---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s434-group
section_title: "Group"
file: "resourcepolicies.md"
lines: 355-366
source_sha256: 36a99f15a2026313
granularity: heading
---
### Group
**/api/authz/resourcepolicies/<:id>/group**

Return the group linked by this resource policy

Return codes:
* 200 Ok if the operation succeed and a group is linked to this resource policy
* 204 No content - if the operation succeed but no group is set for this policy
* 401 Unauthorized - if you are not authenticated and the policy is not related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Resource Policy endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
