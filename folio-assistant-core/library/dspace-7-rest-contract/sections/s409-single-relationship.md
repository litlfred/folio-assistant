---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s409-single-relationship
section_title: "Single Relationship"
file: "relationships.md"
lines: 12-96
source_sha256: 153081453688c8e9
granularity: heading
---
## Single Relationship
**/api/core/relationships/<:id>**

A sample can be found at https://demo.dspace.org/#https://demo.dspace.org/server/api/core/relationships/1117

```json
{
  "id": 530,
  "leftPlace": 1,
  "leftwardValue": "Smith, Jane",
  "rightPlace": 1,
  "type": "relationship",
  "_links": {
    "relationshipType": {
      "href": "https://demo.dspace.org/server/api/core/relationships/530/relationshipType"
    },
    "self": {
      "href": "https://demo.dspace.org/server/api/core/relationships/530"
    },
    "leftItem": {
      "href": "https://demo.dspace.org/server/api/core/items/e98b0f27-5c19-49a0-960d-eb6ad5287067"
    },
    "rightItem": {
      "href": "https://demo.dspace.org/server/api/core/items/0ffbee3f-e7ea-42bc-92fe-2fbef1a52c0f"
    }
  },
  "_embedded": {
    "relationshipType": {
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
  }
}
```

The [relationship type](relationshiptypes.md) is embedded
The 2 items are included as HAL links but are not embedded

An optional leftwardValue and rightwardValue property can be present. It's omitted when it's null.
