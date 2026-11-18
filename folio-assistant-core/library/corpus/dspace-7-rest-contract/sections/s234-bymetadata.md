---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s234-bymetadata
section_title: "byMetadata"
file: "epersons.md"
lines: 79-96
source_sha256: f15d99d416d78ed5
granularity: heading
---
### byMetadata
**GET /api/eperson/epersons/search/byMetadata?query=<:string>**

This supports a basic search across all EPerson accounts via their metadata.
It will search in:
* UUID (exact match)
* first name
* last name
* email address

It returns the list of EPersonRest instances, if any, matching the user query

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the 'query' parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or Community/Collection administrators can use this endpoint.
