---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s175-creating-top-level-community
section_title: "Creating top level community"
file: "communities.md"
lines: 334-355
source_sha256: 91351bf44765781b
granularity: heading
---
### Creating top level community

**POST /api/core/communities**

To create a top level community, perform as post with the JSON below to the communities endpoint when logged in as admin.

```json
{
  "name": "test creation",
  "metadata": {
    "dc.title": [
      {
        "value": "test creation",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  }
}
```
