---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s324-replacing-name-variants
section_title: "Replacing name variants"
file: "metadata-suggestions.md"
lines: 581-622
source_sha256: 29d83451107b7c52
granularity: heading
---
### Replacing name variants

With `namevariant`, the live import suggests to overwrite a single name variant:
* `namevariant/<:place>` is used to suggest replacing the name variant of the relationship at <:place> with the new value

Example response, replacing the the second `dc.contributor.author` name variant:

```json
{
    "dc.contributor.author" : {
      "currentvalues" : [ "D. Pollard", "C. E. Wylie[virtual::1373]" ],
      "suggestions" : [
        {
          "operations": [ "namevariant/metadata/dc.contributor.author/1", "add/metadata/dc.contributor.author/-" ],
          "newvalue": "Wylie, C E"
        }
      ]
    }
}
```

The above example includes two possible operations: an option to replace the `namevariant`, and an option to add the `newvalue` as an additional author.
Assuming the client chooses the first operation (replace the namevariant), the new metadata state is:

```json
{
  "metadata": {
    "dc.contributor.author": [
      { "value": "D. Pollard", "language": null, "authority": null, "confidence": -1 },
      { "value": "Wylie, C E", "language": null, "authority": "virtual::1373", "confidence": 600 }
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
