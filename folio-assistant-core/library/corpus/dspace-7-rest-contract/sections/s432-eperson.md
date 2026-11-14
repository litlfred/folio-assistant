---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s432-eperson
section_title: "EPerson"
file: "resourcepolicies.md"
lines: 320-331
source_sha256: 36a99f15a2026313
granularity: heading
---
### EPerson
**/api/authz/resourcepolicies/<:id>/eperson**

Return the eperson linked by this resource policy

Return codes:
* 200 Ok - if the operation succeed and an eperson is set for this policy
* 204 No content - if the operation succeed but no eperson is set for this policy
* 401 Unauthorized - if you are not authenticated and the policy is not related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Resource Policy endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
