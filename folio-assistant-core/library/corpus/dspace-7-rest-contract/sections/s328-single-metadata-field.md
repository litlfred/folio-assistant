---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s328-single-metadata-field
section_title: "Single Metadata Field"
file: "metadatafields.md"
lines: 11-27
source_sha256: c6cc6468c8c0f419
granularity: heading
---
## Single Metadata Field
**/api/core/metadatafields/<:id>**

Provide detailed information about a specific metadata field. The JSON response document is as follows
```json
{
  "id": 8,
  "element": "contributor",
  "qualifier": "advisor",
  "scopeNote": "Use primarily for thesis advisor.",
  "type": "metadatafield"
}
```

Exposed links:
* schema: the metadata schema to which the item belongs
