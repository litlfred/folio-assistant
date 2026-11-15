---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s290-owning-collection
section_title: "Owning Collection"
file: "items.md"
lines: 409-493
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Owning Collection
**/api/core/items/<:uuid>/owningCollection**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/owningCollection>

It returns the collection where the item belong to

**PUT /api/core/items/<:uuid>/owningCollection**

The actual collection is part of the body using the uri-list. Note that if the parameter inheritPolicies=true is passed in the request, the item will inherit the policies of the target owning collection.

Example:

```curl -i -X PUT "https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/owningCollection" -H "Content-Type:text/uri-list" -d "https://demo.dspace.org/server/api/core/collections/8e0928a0-047a-4369-8883-12669f32dd64"```

It updates the owning collection (moves the item).

Status codes:
* 204 No content - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the item doesn't exist

### Mapped Collections
**GET /api/core/items/<:uuid>/mappedCollections**

It returns all the mapped collections the item is included in.

On the item page, it should be referenced similar to:
```json
    "mappedCollections": {
      "href": "https://demo.dspace.org/server/api/core/items/95e5d7d9-ef4e-4e35-86cc-07bfe2f0e355/mappedCollections"
    }
```

**GET /api/core/items/<:uuid>/mappedCollections/<:collection_uuid>**

_Unsupported._ If you want detailed information about a single mapped collection, use the `/api/core/collections/<collection:uuid>` endpoint.

**POST /api/core/items/<:uuid>/mappedCollections**

A POST request will result in creating a new mapping between the item and collection.
If the collection exists and is neither the owning nor mapped collection for the item, the relation should be created.

```
 curl -i -X POST https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/mappedCollections 
 -H "Content-Type:text/uri-list" --data "https://demo.dspace.org/server/api/core/collections/1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb"
```

The collection(s) MUST be included in the body using the `text/uri-list` content type
 
Return codes:
 * 204: if the update succeeded (including the case of no-op if the mapping was already as requested)
 * 401  Unauthorized - if you are not authenticated
 * 403  Forbidden - if you are not logged in with sufficient permissions 
 * 405: if the item is a template item
 * 422: if the specified collection is not found or is the owningCollection of the item

**PUT /api/core/items/<:uuid>/mappedCollections**

_Unsupported._ You may replace or update mapped collections using DELETE requests and/or POST requests.

**DELETE /api/core/items/<:uuid>/mappedCollections**

_Unsupported._ At this time, we do not support removing all mapped Collections in a single request. Please use `DELETE /api/core/items/<:uuid>/mappedCollections/<:collection_uuid>` to remove mapped Collections one by one.

**DELETE /api/core/items/<:uuid>/mappedCollections/<:collection_uuid>**

A DELETE request will result in removing an existing mapping between the item and collection.
If the collection exists and is a mapped collection for the item, the relation should be deleted.

```
 curl -i -X DELETE https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/mappedCollections/1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb"
```

The above request would remove the mapping between Collection with UUID `1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb` and Item with UUID `1911e8a4-6939-490c-b58b-a5d70f8d91fb`.

Return codes:
 * 204: if the delete succeeded (including the case of no-op if the collection was not mapped) 
 * 401  Unauthorized - if you are not authenticated
 * 403  Forbidden - if you are not logged in with sufficient permissions 
 * 405: if the item is a template item
 * 422: if the specified collection is not found or is the owningCollection of the item
