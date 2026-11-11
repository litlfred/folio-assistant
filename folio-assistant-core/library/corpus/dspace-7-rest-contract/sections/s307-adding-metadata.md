---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s307-adding-metadata
section_title: "Adding metadata"
file: "metadata-patch.md"
lines: 51-111
source_sha256: 521e02056733123b
granularity: heading
---
## Adding metadata

With the `add` operation, you can add any number of metadata values in a single request.

You also use `add` to effectively _replace_ all values for a given metadata key, by specifying
an already-present key as the `path`, and an array of your replacement values as the `value`.
This use of the add operation to replace a list of values may be counter-intiutive, but it
is done according to the [RFC section 4.1](https://tools.ietf.org/html/rfc6902#section-4.1)

> If the target location specifies an object member that does exist, that member's value is replaced.

Note:

* According to the [JSON Patch specification](https://tools.ietf.org/html/rfc6902), to initialize the first
  value for any array, the `add` operation must receive an array of values. Therefore, in the first operation
  below, since it is not possible to add a single value to the not yet initialized `/metadata/dc.description`
  array, we initialize it with an array with one value.
* When values already exist for a metadata key, as in the second operation below, it is necessary to specify
  the new value's position at the end of the `path` (`/0` means first position, `/-` means last).
* When creating new metadata values, if unspecified, the `language` and `authority` properties
  default to `null`, and `confidence` defaults to `-1`.

Example request, adding three values:

```json
[
  {
    "op": "add",
    "path": "/metadata/dc.description",
    "value": [ { "value": "Some description" } ]
  },
  {
    "op": "add",
    "path": "/metadata/dc.title/0",
    "value": { "value": "Zeroth Title" }
  },
  {
    "op": "add",
    "path": "/metadata/dc.title/-",
    "value": { "value": "Final Title", "language": "en_US" }
  }
]
```

New metadata state:

```json
{
  "metadata": {
    "dc.description": [
      { "value": "Some description", "language": null, "authority": null, "confidence": -1 }
    ],
    "dc.title": [
      { "value": "Zeroth Title", "language": null, "authority": null, "confidence": -1 },
      { "value": "Initial Title", "language": null, "authority": null, "confidence": -1 },
      { "value": "Final Title", "language": "en_US", "authority": null, "confidence": -1 }
    ]
  }
}
```
