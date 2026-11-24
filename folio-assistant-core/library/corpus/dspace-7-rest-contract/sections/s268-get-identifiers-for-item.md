---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s268-get-identifiers-for-item
section_title: "Get identifiers for item"
file: "identifiers.md"
lines: 42-89
source_sha256: 4312dd82df940ef8
granularity: heading
---
## Get identifiers for item
**GET /api/pid/identifiers/search/findByItem?uuid=<:uuid>**

Return an array of identifiers associated with the given item.
```json
{
  "_embedded": {
    "identifiers": [
      {
        "id": null,
        "value": "https://doi.org/10.33515/dspace-68",
        "identifierType": "doi",
        "identifierStatus": "TO_BE_REGISTERED",
        "type": "identifier",
        "_links": {
          "self": {
            "href": "http://localhost:8080/server/api/ppid/identifiers"
          }
        }
      },
      {
        "id": null,
        "value": "http://localhost:4000/handle/123456789/375",
        "identifierType": "handle",
        "identifierStatus": null,
        "type": "identifier",
        "_links": {
          "self": {
            "href": "http://localhost:8080/server/api/ppid/identifiers"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "http://localhost:8080/server/api/pid/identifiers/search/findByItem?uuid=71d45ca4-3a50-40d3-b35a-b17cccac3575"
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
