---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s259-resourcetype
section_title: "resourcetype"
file: "features.md"
lines: 47-60
source_sha256: 25a9fe5d65006021
granularity: heading
---
#### resourcetype
**/api/authz/features/search/resourcetype?type=<:string>**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* type: in the form of category.model as used in the REST API. Please note that the model is in its singular form (i.e. core.item, core.site, submission.workspaceitem, etc.)

It returns the list of features that apply to the specified type. 

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the type parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators can access
