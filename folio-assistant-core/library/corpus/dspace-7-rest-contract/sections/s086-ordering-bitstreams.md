---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s086-ordering-bitstreams
section_title: "Ordering bitstreams"
file: "bundles.md"
lines: 219-288
source_sha256: 83759dccfb9965fd
granularity: heading
---
## Ordering bitstreams

**PATCH /api/core/bundles/<:uuid>**

Bitstreams may be re-ordered with the PATCH `move` operation.

Current list of bitstreams:
```json
{
  "bitstreams" : [ 
      {
        "id" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "uuid" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "_links" : {
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/1ce6db0e-662f-4a13-ba87-c371ad664b14"
          }
        }
      }, {
        "id" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "uuid" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "_links" : {
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/4dd9621f-a464-4192-bc17-d70f68845bdc"
          }
        }
      }
  ]
}
```

Example request, moving the last bitstream to the first position:

```json
[
  {
    "op": "move",
    "from": "/_links/bitstreams/1/href",
    "path": "/_links/bitstreams/0/href"
  }
]
```

New list of bitstreams:

```json
{
  "bitstreams" : [ 
      {
        "id" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "uuid" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "_links" : {
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/4dd9621f-a464-4192-bc17-d70f68845bdc"
          }
        }
      },
      {
        "id" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "uuid" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "_links" : {
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/1ce6db0e-662f-4a13-ba87-c371ad664b14"
          }
        }
      }
  ]
}
```
