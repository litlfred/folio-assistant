---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s267-main-endpoint
section_title: "Main Endpoint"
file: "identifiers.md"
lines: 4-41
source_sha256: 4312dd82df940ef8
granularity: heading
---
## Main Endpoint
**GET /api/pid/identifiers**

* GET method not implemented. To fetch an identifier for an item, see [the Items endpoint](items.md).

**POST /api/pid/identifiers?type=<:identifier_type>**
Creates or registers a new identifier for this item. A 'type' parameter is required to indicate which sort of
identifier to create, eg. doi, handle, or other supported identifier types.
Currently, only DOI registration is supported with this method.

The item to be identified must be supplied as URI in the request body using the text/uri-list content-type.

This operation would typically be used to mint and queue a DOI for registration for an item that is already archived.

   ```
   # Example curl command to mint or register a new identifiers
   curl -i -X POST "http://localhost:8080/rest/api/identifiers?type=doi" 
        -H "Content-Type:text/uri-list" 
        -d "http://localhost:8080/rest/api/core/items/5ad50035-ca22-4a4d-84ca-d5132f34f588"
   ```

On success, the identifier resource is returned as a response.
   ```json
    {
      "value" : "https://doi.org/10.33515/dspace-61",
      "identifierType" : "doi",
      "identifierStatus" : "TO_BE_REGISTERED",
      "type" : "identifier"
    }
   ```

Return codes:
* 201 Created - if the operation succeeds
* 400 Bad Request - if the item id param is missing or invalid (not an uuid), or if the type param is missing or invalid, or if the DOI is already registered
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
* 404 Not found - if the item doesn't exist
