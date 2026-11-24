---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s334-creating-a-metadata-field
section_title: "Creating a Metadata Field"
file: "metadatafields.md"
lines: 68-91
source_sha256: c6cc6468c8c0f419
granularity: heading
---
## Creating a Metadata Field

**POST /api/core/metadatafields?schemaId=<:schemaId>**

To create a metadata field, perform a post with the JSON below when logged in as admin.

```json
{
  "element": "contributor",
  "qualifier": "tester",
  "scopeNote": "An agent which provided illustrations for the resource"
}
```

Return codes:
* **201 Created** - if the operation succeed
* **400 Bad Request** - if the body of the request can't be parsed (for example because of a missing field)
* **401 Unauthorized** - if you are not authenticated
* **403 Forbidden** - if you are not logged in with sufficient permissions
* **422 Unprocessable Entity** - if the request is well-formed, but is invalid based on the given data.
  * If the schema ID does not exist
  * If you attempt to create a field with an empty `element` or if it contains dots, commas or spaces or if it's longer than 64 characters.
  * If you attempt to create a field with a `qualifier` contains dots, commas or spaces or if it's longer than 64 characters.
