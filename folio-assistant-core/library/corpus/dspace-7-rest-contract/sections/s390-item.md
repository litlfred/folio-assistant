---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s390-item
section_title: "Item"
file: "profiles.md"
lines: 56-123
source_sha256: 64c203a69ff49a8b
granularity: heading
---
### Item
**GET /api/eperson/profiles/<:eperson-uuid>/item**

Returns the item that model the profile of the eperson with the given uuid. The JSON response document is as follow

```json
{
  "id": "d0601db5-5ceb-4f8d-8762-bd5b3b97845d",
  "uuid": "d0601db5-5ceb-4f8d-8762-bd5b3b97845d",
  "name": null,
  "handle": "123456789/511",
  "metadata": {
    "dspace.object.owner": [{
        "value": "Mortimer Smith",
        "language": null,
        "authority": "eb645ef8-1373-41eb-bf67-6afcea7e2069",
        "confidence": 600,
        "place": 0
      }],
    "dc.date.accessioned": [{
        "value": "2020-07-20T15:31:11Z",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }],
    "dc.date.available": [{
        "value": "2020-07-20T15:31:11Z",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }],
    "dc.description.provenance": [{
        "value": "Made available in DSpace on 2020-07-20T15:31:11Z (GMT). No. of bitstreams: 0",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      }],
    "dc.identifier.uri": [{
        "value": "http://localhost:4000/handle/123456789/511",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }],
    "dspace.entity.type": [{
        "value": "Person",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }]
  },
  "inArchive": true,
  "discoverable": true,
  "withdrawn": false,
  "lastModified": "2020-07-20T16:02:19.608+0000",
  "type": "item"
}
```
It would respond with:
* 200 OK - Returning the item if there's a match
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to view the item
* 404 Not found - if the item doesn't exist
