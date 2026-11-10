---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s048-object
section_title: "Object"
file: "authorizations.md"
lines: 91-101
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
### Object
**/api/authz/authorizations/<:string>/object**

Return the resource where the authorization is scoped.

Return codes:
* 200 Ok if the operation succeed
* 401 Unauthorized - if you are not authenticated and the authorization is not related to the Anonymous user
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Authorization endpoint
* 404 Not found - if the authorization doesn't exist
