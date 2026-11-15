---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s289-bundles
section_title: "Bundles"
file: "items.md"
lines: 329-408
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
### Bundles

**GET /api/core/items/<:uuid>/bundles**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/bundles>

It returns the bundles within this item. See the [bundle endpoint](bundles.md) for more info

```json
{
  "bundles" : [
  {
    "uuid": "d3599177-0408-403b-9f8d-d300edd79edb",
    "name": "ORIGINAL",
    "handle": null,
    "metadata": {},
    "type": "bundle",
    "_links" : {
      "primarybitstream" : {
        "href" : "https://demo.dspace.org/server/api/core/bitstreams/ac49f361-4ffd-47a4-8eb2-e6c73c3f3e76"
      },
      "bitstreams" : {
        "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams"
      },
      "self" : {
        "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb"
      }
    }
  },
  {
    "uuid": "d3599177-0408-403b-9f8d-d300edd79edb",
    "name": "THUMBNAIL",
    "handle": null,
    "metadata": {},
    "type": "bundle",
    "_links" : {
      "primarybitstream" : {
        "href" : "https://demo.dspace.org/server/api/core/bitstreams/ac49f361-4ffd-47a4-8eb2-e6c73c3f3e76"
      },
      "bitstreams" : {
        "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams"
      },
      "self" : {
        "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb"
      }
    }
  }
  ]
}
```

This endpoint is relevant to:
* Retrieve only the bitstreams from a given bundle from an item (e.g. only the thumbnails)
* Retrieve or update the order of the bitstreams in a bundle

**POST /api/core/items/<:uuid>/bundles**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/items/1911e8a4-6939-490c-b58b-a5d70f8d91fb/bundles>

Creating a new bundle in an item would use JSON similar to the example below:

```json
{
  "name": "ORIGINAL",
  "metadata": {}
}
```

It returns the created bundle.

If a bundle with the given doesn't exist yet in the item, it will be created

Status codes:
* 201 Created - if the operation succeed
* 400 Bad Request - if the bundle name already exists in the item
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the item doesn't exist
* 412 Precondition Failed - if there is a discrepancy between the declared size or checksum and the computed one
