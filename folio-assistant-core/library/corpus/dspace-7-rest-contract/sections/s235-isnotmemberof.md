---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s235-isnotmemberof
section_title: "isNotMemberOf"
file: "epersons.md"
lines: 97-114
source_sha256: f15d99d416d78ed5
granularity: heading
---
### isNotMemberOf
**GET /api/eperson/epersons/search/isNotMemberOf?group=<:uuid>&query=<:string>**

This supports a basic search across all EPersons which are not already a member of the provided Group (in the 'group' parameter). Therefore it searches EPersons _not already listed_ on the `/api/eperson/groups/<:uuid>/epersons` endpoint for the provided group.
It will search in:
* UUID (exact match)
* first name
* last name
* email address

It returns the list of EPersonRest instances, if any, matching the user query

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the 'group' or 'query' parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or Community/Collection administrators can use this endpoint.
