---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s340-creating-a-metadata-schema
section_title: "Creating a Metadata Schema"
file: "metadataschemas.md"
lines: 35-56
source_sha256: 5e66a8afcb205dcc
granularity: heading
---
## Creating a Metadata Schema

**POST /api/core/metadataschemas**

To create a metadata schema, perform a post with the JSON below when logged in as admin.

```json
{
  "prefix": "example",
  "namespace": "http://dublincore.org/documents/example/"
}
```

Return codes:
* **201 Created** - if the operation succeed
* **400 Bad Request** - if the body of the request can't be parsed (for example because of a missing field)
* **401 Unauthorized** - if you are not authenticated
* **403 Forbidden** - if you are not logged in with sufficient permissions
* **422 Unprocessable Entity** - if the request is well-formed, but is invalid based on the given data.
  * If you attempt to create a schema with an empty `prefix` or if it contains dots, commas or spaces or if it's longer than 32 characters.
  * If you attempt to create a schema with an empty `namespace`.
