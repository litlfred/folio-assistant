---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s282-creating-an-archived-item
section_title: "Creating an archived item"
file: "items.md"
lines: 124-164
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
## Creating an archived item
**POST /api/core/items?owningCollection=<:uuid>**

Administrators can directly create an archived item (bypassing the workflow). The content-type is JSON. An example JSON can be seen below:

```json
{
  "name": "Practices of research data curation in institutional repositories: A qualitative view from repository staff",
  "metadata": {
    "dc.contributor.author": [
      {
        "value": "Stvilia, Besiki",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.title": [
      {
        "value": "Practices of research data curation in institutional repositories: A qualitative view from repository staff",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.type": [
      {
        "value": "Journal Article",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "inArchive": true,
  "discoverable": true,
  "withdrawn": false,
  "type": "item"
}
```
