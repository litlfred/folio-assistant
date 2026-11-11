---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s195-main-endpoint
section_title: "Main Endpoint"
file: "entitytypes.md"
lines: 8-58
source_sha256: 889b054c4398ad61
granularity: heading
---
## Main Endpoint
**/api/core/entitytypes**

A sample can be found at https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/entitytypes

```json
{
  "_embedded": {
    "entitytypes": [
      {
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
      {
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
    ]
  },
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/entitytypes"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 2,
    "totalPages": 1,
    "number": 0
  }
}
```
