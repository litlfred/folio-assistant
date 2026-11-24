---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s248-single-authority
section_title: "Single Authority"
file: "external-authority-sources.md"
lines: 81-97
source_sha256: 669cf312a4da728a
granularity: heading
---
## Single Authority
**/api/integration/externalsources/<:source-name>**

Provide detailed information about a specific external source. The JSON response document is as follow
```json
{
  "id": "orcid",
  "name": "orcid",
  "hierarchical": false,
  "type": "externalsource"
}
```

Exposed links:
* entries: the list of values managed by the external source
* entityTypes: the list of entity types that are compatible with the provider
