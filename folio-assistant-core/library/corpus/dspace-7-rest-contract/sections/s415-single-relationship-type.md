---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s415-single-relationship-type
section_title: "Single Relationship Type"
file: "relationshiptypes.md"
lines: 13-71
source_sha256: 218a051b0be9f4c9
granularity: heading
---
## Single Relationship Type
**/api/core/relationshiptypes/<:id>**

A sample can be found at https://demo.dspace.org/#https://demo.dspace.org/server/api/core/relationshiptypes/1

```json
{
  "id": 1,
  "leftwardType": "isAuthorOfPublication",
  "rightwardType": "isPublicationOfAuthor",
  "leftMinCardinality": 0,
  "leftMaxCardinality": null,
  "rightMinCardinality": 0,
  "rightMaxCardinality": null,
  "type": "relationshiptype",
  "_links": {
    "leftType": {
      "href": "https://demo.dspace.org/server/api/core/entitytypes/1"
    },
    "rightType": {
      "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
    },
    "self": {
      "href": "https://demo.dspace.org/server/api/core/relationshiptypes/1"
    }
  },
  "_embedded": {
    "leftType": {
      "id": 1,
      "label": "Publication",
      "type": "entitytype",
      "_links": {
        "self": {
          "href": "https://demo.dspace.org/server/api/core/entitytypes/1"
        },
        "relationshiptypes": {
          "href": "https://demo.dspace.org/server/api/core/entitytypes/1/relationshiptypes"
        }
      }
    },
    "rightType": {
      "id": 2,
      "label": "Person",
      "type": "entitytype",
      "_links": {
        "self": {
          "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
        },
        "relationshiptypes": {
          "href": "https://demo.dspace.org/server/api/core/entitytypes/2/relationshiptypes"
        }
      }
    }
  }
}
```

The 2 [item types](itemtypes.md) are embedded
