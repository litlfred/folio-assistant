---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s295-get-item-identifiers
section_title: "Get item identifiers"
file: "items.md"
lines: 533-566
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Get item identifiers
**GET /api/core/items/{:item-uuid}/identifiers**

Returns information about the identifiers associated with this item, for example Handle and DOI URIs. If relevant, the status of the identifier is also included.

The JSON response is formatted like the example below (the same data model as the [identifiers submission step](submissionsections.md)).
```json
{
  "identifiers" : [ {
    "value" : "https://doi.org/10.33515/dspace-61",
    "identifierType" : "doi",
    "identifierStatus" : "TO_BE_REGISTERED",
    "type" : "identifier"
  }, {
    "value" : "123456789/418",
    "identifierType" : "handle",
    "identifierStatus" : null,
    "type" : "identifier"
  } ],
  "type" : "identifiers",
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/server/api/core/items/6bea2772-0e71-4636-8c1c-5c132821fa2c/identifiers"
    }
  }
}
```
Return codes:
* 200 OK - if the operation succeeds
* 400 Bad Request - if the item id param is missing or invalid (not an uuid)
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
* 404 Not found - if the item doesn't exist
