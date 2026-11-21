---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s247-main-endpoint
section_title: "Main Endpoint"
file: "external-authority-sources.md"
lines: 4-80
source_sha256: 669cf312a4da728a
granularity: heading
---
## Main Endpoint
**/api/integration/externalsources**   

Provide access to the configured external sources. It returns the list of existent external sources.

Example:
```json
{
  "_embedded": {
    "externalsources": [
      {
        "id": "orcid",
        "name": "orcid",
        "hierarchical": false,
        "type": "externalsource",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid/entries"
          },
          "entityTypes": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid/entityTypes"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid"
          }
        }
      },
      {
        "id": "ciencia",
        "name": "ciencia",
        "hierarchical": false,
        "type": "externalsource",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/ciencia/entries"
          },
          "entityTypes": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/ciencia/entityTypes"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/ciencia"
          }
        }
      },
      {
        "id": "my_staff_db",
        "name": "my_staff_db",
        "hierarchical": false,
        "type": "externalsource",
        "_links": {
          "entries": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/my_staff_db/entries"
          },
          "entityTypes": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/my_staff_db/entityTypes"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/my_staff_db"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/integration/externalsources"
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
