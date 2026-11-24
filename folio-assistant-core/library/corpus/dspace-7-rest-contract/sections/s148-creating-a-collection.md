---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s148-creating-a-collection
section_title: "Creating a collection"
file: "collections.md"
lines: 663-690
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
## Creating a collection

**POST /api/core/collections?parent=<:communityUUID>**

To create a collection, perform as post with the JSON below when logged in as admin.

```json
{
  "name": "test collection",
  "metadata": {
    "dc.title": [
      {
        "value": "test collection",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  }
}
```

 Error messages:
 * 200 OK - if the operation succeed
 * 401 Unauthorized - if you are not authenticated
 * 403 Forbidden - if you are not logged in with sufficient permissions
 * 422 UNPROCESSABLE ENTITY - if the parent community doesn't exist (the REST URI /api/core/collections still exists)
