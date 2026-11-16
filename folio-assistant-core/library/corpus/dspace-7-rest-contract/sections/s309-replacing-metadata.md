---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s309-replacing-metadata
section_title: "Replacing metadata"
file: "metadata-patch.md"
lines: 150-184
source_sha256: 521e02056733123b
granularity: heading
---
## Replacing metadata

With `replace`, you can overwrite any of the following within a single operation
of a PATCH request:

* The entire set of all object metadata (`path="/metadata"`)
* All metadata values for an existing key (e.g. `path="/metadata/dc.title"`)
* A single existing metadata value (e.g. `path="/metadata/dc.title/0"`)
* A single property of an existing value (e.g. `path="/metadata/dc.title/0/language"`)

Example request, replacing the `value` and `language` of the first `dc.title`:

```json
[
  {
    "op": "replace",
    "path": "/metadata/dc.title/0",
    "value": { "value": "最後のタイトル", "language": "ja_JP" }
  }
]
```

New metadata state:

```json
{
  "metadata": {
    "dc.title": [
      { "value": "最後のタイトル", "language": "ja_JP", "authority": null, "confidence": -1 },
      { "value": "Final Title", "language": "en_US", "authority": null, "confidence": -1 }
    ]
  }
}
```
