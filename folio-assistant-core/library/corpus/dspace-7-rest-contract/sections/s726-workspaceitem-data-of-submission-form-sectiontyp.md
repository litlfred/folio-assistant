---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s726-workspaceitem-data-of-submission-form-sectiontyp
section_title: "WorkspaceItem data of submission-form sectionType"
file: "workspaceitem-data-metadata.md"
lines: 1-47
source_sha256: 452bbe9cabe791be
granularity: heading
---
# WorkspaceItem data of submission-form sectionType
[Back to the definition of the workspaceitems endpoint](workspaceitems.md)

The section data represent the metadata collected for a specific [submissionform](submissionforms.md).
It is a json object with the following structure:

```json
{
  "dc.contributor.author": [
    {
      "value": "Bollini, Andrea",
      "language": null,
      "authority": "rp00001",
      "confidence": 600
    }
  ],
  "dc.title": [
    {
      "value": "Sample Submission Item",
      "language": "en_US",
      "authority": null,
      "confidence": -1
    }
  ],
  "dc.date.issued": [
    {
      "value": "test",
      "language": null,
      "authority": null,
      "confidence": -1
    }
  ]   
}
```

The attribute name is the metadata key using the '.' dot separator (i.e. dc.title, dc.contributor.author, etc.) the value is an array, sorted by the metadatavalue.place column, containing
* value: the textual value of the metadata
* authority: the authority key if any associated
* confidence: the level of confidence for the authority if any, -1 otherwise
* language: the iso code associated with the textual value if any

Note: The metadata of _archived_ items is modeled in the same way described here -- as a map
of metadata keys to an ordered array of values. The primary difference is where the metadata
is located within the JSON representation. The documentation and examples below apply to
items during submission, whereas the [Modifying Metadata via PATCH](metadata-patch.md)
document describes how they can be modified _after_ they have been archived.
