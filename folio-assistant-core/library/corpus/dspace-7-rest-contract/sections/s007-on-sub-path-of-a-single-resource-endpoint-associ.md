---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s007-on-sub-path-of-a-single-resource-endpoint-associ
section_title: "On Sub-Path of a Single Resource Endpoint (Associations)"
file: "README.md"
lines: 94-129
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### On Sub-Path of a Single Resource Endpoint (Associations)

This type of endpoint interacts with (one or more) resources that are *associated with* a single resource. For that reason, it is sometimes called an "association" endpoint. For example: `/api/core/items/<:uuid>/mappedCollections` references all Collections that are mapped to a single Item resource.

- `GET` -
Returns the state of the association (for the current resource)

- `PUT` -
Binds (or links) the resource(s) pointed to by the given URI(s) to the current resource. This replaces any existing links with the URIs passed in the request. Resource URIs to link must be sent in the body of the request using `Content-Type:text/uri-list`. [See example from Spring Data REST Relationships](https://www.baeldung.com/spring-data-rest-relationships). Return `400 Bad Request` if multiple URIs were given for a *-to-one-association
   ```
   # Example curl command to replace Item-to-Collection mappings with the two listed
   # Notice the two Collection URIs are separated by a newline (\n)
   curl -i -X PUT "http://localhost:8080/rest/api/core/items/<:uuid>/mappedCollections" 
        -H "Content-Type:text/uri-list" 
        -d "http://localhost:8080/rest/api/core/collections/1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb \n http://localhost:8080/rest/api/core/collections/5ad50035-ca22-4a4d-84ca-d5132f34f588"
   ```

- `POST` -
Only supported for collection associations (i.e. associations allowing for multiple resources). Adds/Links a new resource (via its URI) to the association. Resource URIs to link must sent in the body of the request using `Content-Type:text/uri-list`. [See example from Spring Data REST Relationships](https://www.baeldung.com/spring-data-rest-relationships)
   ```
   # Example curl command to add a *new* Collection mapping for an Item
   curl -i -X POST "http://localhost:8080/rest/api/core/items/<:uuid>/mappedCollections" 
        -H "Content-Type:text/uri-list" 
        -d "http://localhost:8080/rest/api/core/collections/5ad50035-ca22-4a4d-84ca-d5132f34f588"
   ```

- `DELETE` -
Unbinds (unlinks) the association. Return `405 Method Not Allowed` if the association is required (and cannot be removed).  DELETE requests should _not_ contain a request body as some clients do not support sending a DELETE request with a body. Therefore, if an individual association needs to be removed, the DELETE request should reference that individual association in the URI of the request. For example:
   ```
   # Example curl command to delete a *single* Collection mapping for an Item
   curl -i -X DELETE "http://localhost:8080/rest/api/core/items/<:uuid>/mappedCollections/<:collection_uuid>"
   
   # Example curl command to delete *ALL* Collection mappings for an item (unsupported at this time)
   curl -i -X DELETE "http://localhost:8080/rest/api/core/items/<:uuid>/mappedCollections
   ```
