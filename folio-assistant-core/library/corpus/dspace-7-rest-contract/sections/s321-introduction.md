---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s321-introduction
section_title: "Introduction"
file: "metadata-suggestions.md"
lines: 460-495
source_sha256: 29d83451107b7c52
granularity: heading
---
### Introduction

The live import can suggest metadata changes.
The user should be given the choice to apply or ignore these metadata changes.

The suggestions will be presented in a format similar to the [Metadata Patch](metadata-patch.md)
to allow the user-interface to easily display and apply the suggested changes.

The suggestions include per metadata value:
* The current values present in the item
* Per suggested change, one or more operations (the first operation is assumed to be the preferred action)
  * "add" is used to suggest adding the value at the end
  * "replace/<:place>" is used to suggest replacing the value at <:place> with the new value
  * "namevariant/<:place>" is used to suggest replacing the name variant of the relationship at <:place> with the new value
  * "add-relationship" is used to suggest creating a new relationship
* The new value for the suggested change

The examples in each section below build on each other, assuming an initial metadata state of:

```json
{
  "metadata": {
    "dc.contributor.author": [
      { "value": "D. Pollard", "language": null, "authority": null, "confidence": -1 },
      { "value": "C. E. Wylie", "language": null, "authority": "virtual::1373", "confidence": 600 }
    ],
    "dc.date.issued": [
      { "value": "2019", "language": null, "authority": null, "confidence": -1 }
    ]
  }
}
```

The user interface can display the suggested metadata changes, and request the user to accept or reject the changes.
If accepted, the user interface can perform a PATCH based on the suggested metadata changes to apply the suggestions.
