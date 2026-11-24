---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s422-resource
section_title: "resource"
file: "resourcepolicies.md"
lines: 52-67
source_sha256: 36a99f15a2026313
granularity: heading
---
#### resource
**/api/authz/resourcepolicies/search/resource?uuid=<:uuid>[&action=<:string>]**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the resource object of the policy
* action: optional, limit the returned policies to the specified action (see GET description for allowed values)

It returns the list of matching resource policies

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and users with ADMIN right on the target resource can use the endpoint
