---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s047-eperson
section_title: "EPerson"
file: "authorizations.md"
lines: 79-90
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
### EPerson
**/api/authz/authorizations/<:string>/eperson**

Return the eperson linked by this authorization

Return codes:
* 200 Ok - if the operation succeed and an eperson is set for this policy
* 204 No content - if the authorization is related to anonymous users
* 401 Unauthorized - if you are not authenticated and the authorization is not related to the Anonymous user
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Authorization endpoint
* 404 Not found - if the authorization doesn't exist
