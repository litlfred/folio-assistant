---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s301-single-item-template
section_title: "Single Item template"
file: "itemtemplates.md"
lines: 9-36
source_sha256: 3d264e2d3881f5a2
granularity: heading
---
## Single Item template
**/api/core/itemtemplates/<:uuid>**

Provide detailed information about a specific item. The JSON response document is as follow
```json
{
  "uuid": "1911e8a4-6939-490c-b58b-a5d70f8d91fb",
  "name": null,
  "handle": null,
  "metadata": {
    "dc.type": [
      {
        "value": "Journal Article",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      }
    ]
  },
  "inArchive": false,
  "discoverable": false,
  "withdrawn": false,
  "lastModified": "2019-06-24T00:40:54.970+0000",
  "type": "item"
}
```
