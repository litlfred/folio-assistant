---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s323-replacing-metadata
section_title: "Replacing metadata"
file: "metadata-suggestions.md"
lines: 540-580
source_sha256: 29d83451107b7c52
granularity: heading
---
### Replacing metadata

With `replace`, the live import suggests to overwrite a single existing metadata value:
* `replace/<:place>` is used to suggest replacing the value at <:place> with the new value

Example response, replacing the the first `dc.date.issued`:

```json
{
    "dc.date.issued" : {
      "currentvalues": [ "2019" ],
      "suggestions": [
        {
          "operations": [ "replace/metadata/dc.date.issued/0" ],
          "newvalue": "2019-09-23"
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
      { "value": "2019-09-23", "language": null, "authority": null, "confidence": -1 }
    ],
    "dc.subject": [
      { "value": "DNA replication inhibitors", "language": null, "authority": null, "confidence": -1 },
      { "value": "Mycobacterium", "language": null, "authority": null, "confidence": -1 }
    ]
  }
}
```
