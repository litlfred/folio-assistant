---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s256-main-endpoint
section_title: "Main Endpoint"
file: "features.md"
lines: 6-18
source_sha256: 25a9fe5d65006021
granularity: heading
---
## Main Endpoint
**/api/authz/features**

List all the available features in the system. Access is restricted to system administrators.

Parameters:
* page, size [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators can access
