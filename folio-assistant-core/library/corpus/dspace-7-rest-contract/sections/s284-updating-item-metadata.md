---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s284-updating-item-metadata
section_title: "Updating item metadata"
file: "items.md"
lines: 181-212
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
## Updating item metadata

**PUT /api/core/items/<:uuid>**

Provide updated metadata information for an item, when the update is completed the updated object will be returned. The JSON to update can be found below.

```json
{
  "uuid": "a8ba963f-d9c9-4198-b5a4-3f74e2ab6fb9",
  "handle": "123456789/60636",
  "metadata": {
    "dc.contributor.author": [
      {
        "value": "Velasco, Mercedes",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.title": [
      {
        "value": "Test new title",
        "language": "pt_BR",
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "type": "item"
}
```
