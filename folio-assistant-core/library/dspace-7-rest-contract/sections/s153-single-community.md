---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s153-single-community
section_title: "Single Community"
file: "communities.md"
lines: 11-83
source_sha256: 91351bf44765781b
granularity: heading
---
## Single Community 
**/api/core/communities/<:uuid>**

Provide detailed information about a specific community. The JSON response document is as follow
```json
{
  "uuid": "7669c72a-3f2a-451f-a3b9-9210e7a4c02f",
  "name": "OR2017 - Demonstration",
  "handle": "10673/11",
  "archivedItemsCount": 12,
  "metadata": {
    "dc.description": [
      {
        "value": "First description",
        "language": null,
        "authority": null,
        "confidence": -1
      },
      {
        "value": "Second description",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description.abstract": [
      {
        "value": "This is a test community to hold content for the OR2017 demostration",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description.tableofcontents": [
      {
        "value": "",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.rights": [
      {
        "value": "",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.title": [
      {
        "value": "OR2017 - Demonstration",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "type": "community"
}
```

Exposed links:
* subcommunities: list of sub-communities within this community
* collections: list of collections within this community
* logo: link to the bitstream that represent the community's logo
* parentCommunity: the community containing this community
* adminGroup: the Community Administrator group

Other properties:
* archivedItemsCount - The count of the items in the given container. It returns -1 when counting items feature
  is disabled at backend.
