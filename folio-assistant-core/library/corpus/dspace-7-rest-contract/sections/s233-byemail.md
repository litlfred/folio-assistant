---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s233-byemail
section_title: "byEmail"
file: "epersons.md"
lines: 64-78
source_sha256: f15d99d416d78ed5
granularity: heading
---
### byEmail
**/api/eperson/epersons/search/byEmail?email=<:string>**

The supported parameters are:
* email: mandatory, EPerson's email address to search

It returns the EPersonRest instance, if any, matching the user query

Return codes:
* 200 OK - if the search operation succeeds and an EPerson with the given email address exists
* 204 OK - if the search operation succeeds, but an EPerson with the given email address does not exist
* 400 Bad Request - if the email parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and users with READ rights on the target EPerson can use the endpoint
