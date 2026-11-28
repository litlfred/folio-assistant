---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s149-updating-a-collection
section_title: "Updating a collection"
file: "collections.md"
lines: 691-729
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
## Updating a collection

**PUT /api/core/collections/<:uuid>**

Provide updated metadata information about a specific collection, when the update is completed the updated object will be returned. The JSON to update can be found below.

```json
{
  "uuid": "20263916-6a3d-4fdc-a44a-4616312f030c",
  "handle": "10673/2",
  "metadata": {
    "dc.title": [
      {
        "value": "test collection",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description": [
      {
        "value": "Test description",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "type": "collection"
}
```  

Error messages:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the collection doesn't exist
* 422 UNPROCESSABLE ENTITY - Altering one of the non-editable parameters will result in a 422 UNPROCESSABLE ENTITY error. The non-editable parameters are optional, but if they are specified, they have to remain identical to the current value. The id, uuid, handle and type are non-editable.
