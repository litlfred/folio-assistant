---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s220-bymetadata
section_title: "byMetadata"
file: "epersongroups.md"
lines: 332-347
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### byMetadata
**GET /api/eperson/groups/search/byMetadata?query=<:string>**

This supports a basic search across all Groups via their metadata.
It will search in:
* UUID (exact match)
* group name

It returns the list of GroupRest instances, if any, matching the user query

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the 'query' parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or Community/Collection administrators can use this endpoint.
