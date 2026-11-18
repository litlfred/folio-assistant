---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s332-byschema
section_title: "bySchema"
file: "metadatafields.md"
lines: 38-49
source_sha256: c6cc6468c8c0f419
granularity: heading
---
#### bySchema
**/api/core/metadatafields/search/bySchema?schema=<:prefix>**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/metadatafields/search/bySchema?schema=dc>

The supported parameters are:
* **(mandatory)** schema, the prefix of the metadata schema (i.e. "dc", "dcterms", "eperson, etc.)
* page, size [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeed
