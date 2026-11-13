---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s005-on-collection-of-resources-endpoints
section_title: "On Collection of Resources Endpoints"
file: "README.md"
lines: 51-73
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### On Collection of Resources Endpoints

This type of endpoint interacts with a group (or collection) of resources (objects). For example: `/api/core/items` references *all* Items in the system.

- `POST` -
Creates a new resource (object) and adds it to the group. Any required data (i.e. attributes) for the new object _must be included_ in the request body. An empty request body is not allowed, unless you are creating an empty object with no attributes.
    - Related or additional information (such as required associations to other objects) may be passed as querystring parameters in the request, _if it is required to create the object._
        ```
        # For example, creating a Collection *requires* linking it to a parent Community
        # In this scenario, we must have a querystring param to specify the parent Community UUID
        curl -i -X POST "http://localhost:8080/rest/api/core/collections?parent=<:communityUUID>" 
            -H "Content-Type:application/json" 
            -d "[{ ... attributes of new Collection ... }]"
        ```

- `GET` -
Returns the first page of the resources in the group (or collection). See [Pagination](#pagination) section. 

- `PATCH` -
  Allows for batch updates (e.g. batch deletion via Patch 'remove' operation) to several resources in the collection at once.
  The request body must adhere to the the [JSON Patch specification RFC6902](https://tools.ietf.org/html/rfc6902).
  See [General rules for the Patch operation](patch.md) for more details.
