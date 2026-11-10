---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s177-updating-a-community
section_title: "Updating a community"
file: "communities.md"
lines: 384-422
source_sha256: 91351bf44765781b
granularity: heading
---
## Updating a community

**PUT /api/core/communities/<:uuid>**

Provide updated metadata information about a specific community, when the update is completed the updated object will be returned. The JSON to update can be found below.

```json
{
  "uuid": "b8872eba-1a79-4b8b-a8f6-55fa8f73197b",
  "handle": "123456789/60631",
  "metadata": {
    "dc.title": [
      {
        "value": "test new title",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description": [
      {
        "value": "An example description",
        "language": "en",
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "type": "community"
}
```  

Error messages:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the community doesn't exist
* 422 UNPROCESSABLE ENTITY - Altering one of the non-editable parameters will result in a 422 UNPROCESSABLE ENTITY error. The non-editable parameters are optional, but if they are specified, they have to remain identical to the current value. The id, uuid, handle and type are non-editable.
