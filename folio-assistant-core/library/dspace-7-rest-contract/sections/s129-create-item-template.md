---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s129-create-item-template
section_title: "Create Item template"
file: "collections.md"
lines: 281-318
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### Create Item template
**POST /api/core/collections/<:uuid>/itemtemplate**

To be used on a collection without a item template.
The metadata is included in JSON

```json
{
  "metadata": {
    "dc.type": [
      {
        "value": "Journal Article",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "inArchive": false,
  "discoverable": false,
  "withdrawn": false,
  "type": "item"
}
```

* The collection is determined using the ID in the URL
* The metadata is uploaded using JSON
* The properties inArchive, discoverable, withdrawn can be omitted or false, but not true

It returns the created item. [See the item endpoint for more info](items.md#Single Item)

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the collection doesn't exist
* 422 Unprocessable Entity - if inArchive, discoverable, withdrawn was set to true, or if the collection already contains a itemtemplate
