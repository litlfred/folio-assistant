---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s132-default-access-conditions
section_title: "Default Access Conditions"
file: "collections.md"
lines: 329-367
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### Default Access Conditions
**/api/core/collections/<:uuid>/defaultAccessConditions**

It returns the resource policies applied by default to new submissions in the collection. They are the DEFAULT\_BITSTREAM\_READ policies of the collection

The json representation is as follow
```json
{
  "_embedded": {
    "resourcePolicies": [
      {
        "id": 2844,
        "name": null,
        "groupUUID": "11cc35e5-a11d-4b64-b5b9-0052a5d15509",
        "action": "DEFAULT_BITSTREAM_READ",
        "type": "resourcePolicy",
        "_links": {
          "self": {
            "href": "https://demo.dspace.org/server/api/authz/resourcePolicies/2844"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/collections/5ad50035-ca22-4a4d-84ca-d5132f34f588/defaultAccessConditions"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "number": 0
  }
}
```
see also the [ResourcePolicies endpoint](resourcepolicies.md)
