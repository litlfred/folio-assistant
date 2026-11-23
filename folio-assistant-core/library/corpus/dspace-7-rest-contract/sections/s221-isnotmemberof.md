---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s221-isnotmemberof
section_title: "isNotMemberOf"
file: "epersongroups.md"
lines: 348-363
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### isNotMemberOf
**GET /api/eperson/groups/search/isNotMemberOf?group=<:uuid>&query=<:string>**

This supports a basic search across all Groups which are not already a member (subgroup) of the provided Group (in the 'group' parameter). Therefore it searches across Groups _not already listed_ on the `/api/eperson/groups/<:uuid>/subgroups` endpoint for the provided group.
It will search in:
* UUID (exact match)
* group name

It returns the list of GroupRest instances, if any, matching the user query

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the 'group' or 'query' parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or Community/Collection administrators can use this endpoint.
