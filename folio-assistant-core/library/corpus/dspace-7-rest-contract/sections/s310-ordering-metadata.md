---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s310-ordering-metadata
section_title: "Ordering metadata"
file: "metadata-patch.md"
lines: 185-212
source_sha256: 521e02056733123b
granularity: heading
---
## Ordering metadata

Metadata may be re-ordered with the `move` operation.

Example request, moving the last `dc.title` value to the first position:

```json
[
  {
    "op": "move",
    "from": "/metadata/dc.title/1",
    "path": "/metadata/dc.title/0"
  }
]
```

New metadata state:

```json
{
  "metadata": {
    "dc.title": [
      { "value": "Final Title", "language": "en_US", "authority": null, "confidence": -1 },
      { "value": "最後のタイトル", "language": "ja_JP", "authority": null, "confidence": -1 }
    ]
  }
}
```
