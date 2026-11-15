---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s308-removing-metadata
section_title: "Removing metadata"
file: "metadata-patch.md"
lines: 112-149
source_sha256: 521e02056733123b
granularity: heading
---
## Removing metadata

With the `remove` operation, you can delete:

* All metadata with a given key (e.g. `path="/metadata/dc.description"`)
* A single metadata value with a known position (e.g. `path="/metadata/dc.title/0"`)

When only one value is present for a particular key, it is functionally equivalent to
specify the path to the key or the value.

Example request, removing two values:

```json
[
  {
    "op": "remove",
    "path": "/metadata/dc.description"
  },
  {
    "op": "remove",
    "path": "/metadata/dc.title/0"
  }
]
```

New metadata state:

```json
{
  "metadata": {
    "dc.title": [
      { "value": "Initial Title", "language": null, "authority": null, "confidence": -1 },
      { "value": "Final Title", "language": "en_US", "authority": null, "confidence": -1 }
    ]
  }
}
```
