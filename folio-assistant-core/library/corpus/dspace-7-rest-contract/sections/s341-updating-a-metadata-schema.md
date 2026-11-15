---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s341-updating-a-metadata-schema
section_title: "Updating a Metadata Schema"
file: "metadataschemas.md"
lines: 57-78
source_sha256: 5e66a8afcb205dcc
granularity: heading
---
## Updating a Metadata Schema

**PUT /api/core/metadataschemas/<:id>**

Provide updated information about a specific metadata schema, when the update is completed the updated object will be returned. The JSON to update can be found below.
```json
{
  "id": 7,
  "prefix": "example",
  "namespace": "http://dublincore.org/documents/exampleUpdated/"
}
```

Return codes:
* **200 OK** - if the operation succeed
* **400 Bad Request** - if the body of the request can't be parsed (for example because of a missing field)
* **401 Unauthorized** - if you are not authenticated
* **403 Forbidden** - if you are not logged in with sufficient permissions
* **422 Unprocessable Entity** - if the request is well-formed, but is invalid based on the given data.
  * If you attempt to update the `prefix`.
  * If you attempt to update the `namespace` with an empty `namespace`.
