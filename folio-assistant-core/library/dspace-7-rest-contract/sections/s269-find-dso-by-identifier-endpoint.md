---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s269-find-dso-by-identifier-endpoint
section_title: "Find DSO by identifier endpoint"
file: "identifiers.md"
lines: 90-102
source_sha256: 4312dd82df940ef8
granularity: heading
---
## Find DSO by identifier endpoint
**GET /api/pid/find?id=<:identifier>**

Resolve a given <:identifier> string to a DSpace Object and redirect the request to the endpoint for that resource.
The identifier string should be a handle or DOI.

Returns:

**302** redirect to the object on success

**404** not found if the object cannot be found

**501** not implemented if the identifier is not resolvable
