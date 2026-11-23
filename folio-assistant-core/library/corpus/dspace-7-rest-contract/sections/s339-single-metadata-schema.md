---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s339-single-metadata-schema
section_title: "Single Metadata Schema"
file: "metadataschemas.md"
lines: 11-34
source_sha256: 5e66a8afcb205dcc
granularity: heading
---
## Single Metadata Schema
**/api/core/metadataschemas/<:id>**

Provide detailed information about a specific metadata schema. The JSON response document is as follow
```json
{
  "id": 1,
  "prefix": "dc",
  "namespace": "http://dublincore.org/documents/dcmi-terms/",
  "type": "metadataschema",
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/metadataschemas/1"
    }
  }
}
```

Exposed links: none

Return codes:
* **200 OK** - if the operation succeed
* **404 Not Found** - if the metadata schema doesn't exist
