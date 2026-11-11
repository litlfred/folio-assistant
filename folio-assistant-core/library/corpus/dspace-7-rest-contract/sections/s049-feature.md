---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s049-feature
section_title: "Feature"
file: "authorizations.md"
lines: 102-111
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
### Feature
**/api/authz/authorizations/<:string>/feature**

Return the feature resource that the user can access thanks to this authorization.

Return codes:
* 200 Ok if the operation succeed
* 401 Unauthorized - if you are not authenticated and the authorization is not related to the Anonymous user
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Authorization endpoint
* 404 Not found - if the authorization doesn't exist
