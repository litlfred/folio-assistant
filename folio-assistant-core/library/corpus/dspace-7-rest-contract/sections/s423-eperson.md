---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s423-eperson
section_title: "eperson"
file: "resourcepolicies.md"
lines: 68-83
source_sha256: 36a99f15a2026313
granularity: heading
---
#### eperson
**/api/authz/resourcepolicies/search/eperson?uuid=<:uuid>[&resource=<:uuid>]**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* uuid: mandatory, the uuid of the eperson that benefit of the policy
* resource: optional, limit the returned policies to the ones related to the specified resource

It returns the list of explicit matching resource policies, no inherited or broader resource policies will be included in the list nor policies derived by groups' membership

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the uuid parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or the user specified in the uuid parameter can use the endpoint
