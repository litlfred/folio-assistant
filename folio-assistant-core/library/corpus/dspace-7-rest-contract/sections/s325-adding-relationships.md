---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s325-adding-relationships
section_title: "Adding relationships"
file: "metadata-suggestions.md"
lines: 623-665
source_sha256: 29d83451107b7c52
granularity: heading
---
### Adding relationships

With `add-relationship`, the live import suggests to add a new relationship
* `add-relationship` is used to suggest creating a new relationship

Example response, adding a `dc.contributor.author` relationship:

```json
{
    "dc.contributor.author" : {
      "currentvalues" : [ "D. Pollard", "C. E. Wylie[virtual::1373]" ],
      "suggestions" : [
        {
          "operations": [ "add-relationship/metadata/dc.contributor.author/-" ],
          "newvalue": "Newton, J R",
          "item": "1f8b3dd7-f5ae-4153-bf17-808d3a5379ac",
          "relationship-type" : 1
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
      { "value": "Wylie, C E", "language": null, "authority": "virtual::1373", "confidence": 600 },
      { "value": "Newton, J R", "language": null, "authority": "virtual::1375", "confidence": 600 }
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
