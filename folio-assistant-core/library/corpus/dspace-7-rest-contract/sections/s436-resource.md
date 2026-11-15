---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s436-resource
section_title: "Resource"
file: "resourcepolicies.md"
lines: 390-401
source_sha256: 36a99f15a2026313
granularity: heading
---
### Resource
**/api/authz/resourcepolicies/<:id>/resource**

Return the resource target of this resource policy.

The resource target cannot be modified. If you need to do so please delete the policy and create a new one.

Return codes:
* 200 Ok if the operation succeed
* 401 Unauthorized - if you are not authenticated and the policy is not related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Resource Policy endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
