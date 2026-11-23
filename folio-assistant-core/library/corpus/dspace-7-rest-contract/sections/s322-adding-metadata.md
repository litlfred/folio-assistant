---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s322-adding-metadata
section_title: "Adding metadata"
file: "metadata-suggestions.md"
lines: 496-539
source_sha256: 29d83451107b7c52
granularity: heading
---
### Adding metadata

With the `add` operation, the live import suggests to add metadata new values.

Example response, suggestion the addition of three values:

```json
{
  "dc.subject" : {
    "currentvalues" : [],
    "suggestions": [
      {
        "operations": [ "add/metadata/dc.subject/-" ],
        "newvalue": "DNA replication inhibitors"
      },
      {
        "operations": [ "add/metadata/dc.subject/-" ],
        "newvalue": "Mycobacterium"
      }
    ]
  }
}
```

If this patch is applied hereafter, the new metadata state is:

```json
{
  "metadata": {
    "dc.contributor.author": [
      { "value": "D. Pollard", "language": null, "authority": null, "confidence": -1 },
      { "value": "C. E. Wylie", "language": null, "authority": "virtual::1373", "confidence": 600 }
    ],
    "dc.date.issued": [
      { "value": "2019", "language": null, "authority": null, "confidence": -1 }
    ],
    "dc.subject": [
      { "value": "DNA replication inhibitors", "language": null, "authority": null, "confidence": -1 },
      { "value": "Mycobacterium", "language": null, "authority": null, "confidence": -1 }
    ]
  }
}
```
