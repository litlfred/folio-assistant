---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s667-main-endpoint
section_title: "Main Endpoint"
file: "vocabularies.md"
lines: 6-77
source_sha256: 67f98500ba3827b6
granularity: heading
---
## Main Endpoint
**/api/submission/vocabularies**   

Provide access to the configured controlled vocabularies. It returns the list of existent controlled vocabularies.

Example:
```json
{
  "_embedded": {
    "vocabularies": [
      {
        "id": "srsc",
        "name": "srsc",
        "scrollable": false,
        "hierarchical": true,
        "preloadLevel": 1,
        "type": "vocabulary",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/srsc/entries"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/srsc"
          }
        }
      },
      {
        "id": "common_types",
        "name": "common_types",
        "scrollable": true,
        "hierarchical": false,
        "type": "vocabulary",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/srsc/entries"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/srsc"
          }
        }
      },
      {
        "id": "common_iso_languages",
        "name": "common_iso_languages",
        "scrollable": true,
        "hierarchical": false,
        "type": "vocabulary",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/common_iso_languages/entries"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/submission/vocabularies/common_iso_languages"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/submission/vocabularies"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 3,
    "totalPages": 1,
    "number": 0
  }
}
```
