---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s280-single-item
section_title: "Single Item"
file: "items.md"
lines: 13-99
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
## Single Item
**/api/core/items/<:uuid>**

***
:warning: In the below example response, the existence of the `place` field for specific metadata values is still under analysis. We are determining whether it can be removed entirely in favor of using the array index (as the `place` field represents the index of each value in an ordered array). For more details see Github issue https://github.com/DSpace/DSpace/issues/7582
***

Provide detailed information about a specific item. The JSON response document is as follow
```json
{
  "uuid": "1911e8a4-6939-490c-b58b-a5d70f8d91fb",
  "name": "Practices of research data curation in institutional repositories: A qualitative view from repository staff",
  "handle": "10673/20",
  "metadata": {
    "dc.contributor.author": [
      {
        "value": "Stvilia, Besiki",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      },
      {
        "value": "Lee, Dong Joon",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 1
      }
    ],
    "dc.identifier.url": [
      {
        "value": "http://europepmc.org/abstract/MED/28301533",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      }
    ],
    "dc.title": [
      {
        "value": "Practices of research data curation in institutional repositories: A qualitative view from repository staff",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      }
    ],
    "dc.type": [
      {
        "value": "Journal Article",
        "language": "en",
        "authority": null,
        "confidence": -1,
        "place": 0
      }
    ]
  },
  "inArchive": true,
  "discoverable": true,
  "withdrawn": false,
  "lastModified": "2017-06-24T00:40:54.970+0000",
  "type": "item"
}
```

Item properties:
* handle: the handle identifier assigned to the item, if any
* metadata: a map of all the item's metadata where the metadata field is used to build the key in the form of <schema>.<element>[.<qualifier] and the values are an ordered list of metadata values. Administrative metadata, such as dc.description.provenance can be filtered out and available only to administrators according to the system configuration, see metadata.hide.* properties in the dspace.cfg file. For withdrawn items the actual metadata are only shown to administrators, all the other users will get an empty property
* inArchive: it will be true only for items that have been successful deposited in the repository and have passed all, if any, the defined workflow steps. For item related to workspaceitem, workflowitem or template items this attribute will stay at false
* discoverable: true if the item is expected to be findable trough a search or browse by authorized user
* withdrawn: true it the item has been retired from the repository

Exposed links:
* bundles: list of bundles within the item
* owningCollection: the collection where the item belong to
* mappedCollections: the collections where the item is mapped to
* templateItemOf: the collection that have the item as template
* relationships: the relationships to other items
* thumbnail: the main thumbnail of the item

Status codes:
* 200 OK - if the item is found and it is visible to the current user or the anonymous user. Withdrawn items are returned
* 401 Unauthorized - if you are not authenticated and the item is not visible to anonymous users
* 403 Forbidden - if you are not logged in with sufficient permissions. Please note that withdrawn items are visible to everyone without any metadata details
* 404 Not found - if the item doesn't exist
