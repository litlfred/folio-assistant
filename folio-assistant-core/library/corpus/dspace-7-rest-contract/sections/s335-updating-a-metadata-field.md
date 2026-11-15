---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s335-updating-a-metadata-field
section_title: "Updating a Metadata Field"
file: "metadatafields.md"
lines: 92-115
source_sha256: c6cc6468c8c0f419
granularity: heading
---
## Updating a Metadata Field

**PUT /api/core/metadatafields/<:id>**

To update the `scopeNote` of a specific metadata field, when the update is completed the updated object will be returned. The JSON to update can be found below.
```json
{
  "id": 7,
  "element": "contributor",
  "qualifier": "tester",
  "scopeNote": null
}
```

Return codes:
* **200 OK** - if the operation succeed
* **400 Bad Request** - if the body of the request can't be parsed (for example because of a missing field)
* **401 Unauthorized** - if you are not authenticated
* **403 Forbidden** - if you are not logged in with sufficient permissions
* **404 Not found** - if the metadata field doesn't exist
* **422 Unprocessable Entity** - if the request is well-formed, but is invalid based on the given data.
  * If you attempt to update the `element`.
  * If you attempt to update the `qualifier`.
