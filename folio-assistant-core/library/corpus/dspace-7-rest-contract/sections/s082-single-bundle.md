---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s082-single-bundle
section_title: "Single Bundle"
file: "bundles.md"
lines: 9-147
source_sha256: 83759dccfb9965fd
granularity: heading
---
## Single Bundle
**/api/core/bundles/<:uuid>**

Provide detailed information about a specific bundle. A sample JSON response document is included below
```json
{
  "uuid": "d3599177-0408-403b-9f8d-d300edd79edb",
  "name": "ORIGINAL",
  "handle": null,
  "metadata": {
      "dc.title": [
        {
          "value": "ORIGINAL",
          "language": null,
          "authority": null,
          "confidence": -1,
          "place": 0
        }
      ]
  },
  "type": "bundle",
  "_links" : {
    "primarybitstream" : {
      "href" : "https://demo.dspace.org/server/api/core/bitstreams/ac49f361-4ffd-47a4-8eb2-e6c73c3f3e76"
    },
    "bitstreams" : {
      "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams"
    },
    "item" : {
      "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/item"
    },
    "self" : {
      "href" : "https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb"
    }
  },
   "_embedded" : {
      "bitstreams" : [ {
        "id" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "uuid" : "1ce6db0e-662f-4a13-ba87-c371ad664b14",
        "name" : "atmire-logo.jpeg",
        "handle" : null,
        "metadata" : {
          "dc.description" : [ {
            "value" : "",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ],
          "dc.source" : [ {
            "value" : "atmire-logo.jpeg",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ],
          "dc.title" : [ {
            "value" : "atmire-logo.jpeg",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ]
        },
        "sizeBytes" : 7568,
        "checkSum" : {
          "checkSumAlgorithm" : "MD5",
          "value" : "59a4cfd819ce67ba7252efc52d1eb99b"
        },
        "sequenceId" : null,
        "type" : "bitstream",
        "_links" : {
          "content" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/1ce6db0e-662f-4a13-ba87-c371ad664b14/content"
          },
          "format" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/1ce6db0e-662f-4a13-ba87-c371ad664b14/format"
          },
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/1ce6db0e-662f-4a13-ba87-c371ad664b14"
          }
        }
      }, {
        "id" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "uuid" : "4dd9621f-a464-4192-bc17-d70f68845bdc",
        "name" : "atmire-logo.jpeg.jpg",
        "handle" : null,
        "metadata" : {
          "dc.description" : [ {
            "value" : "Generated Thumbnail",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ],
          "dc.source" : [ {
            "value" : "Written by FormatFilter org.dspace.app.mediafilter.JPEGFilter on 2018-05-30T14:28:19Z (GMT).",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ],
          "dc.title" : [ {
            "value" : "atmire-logo.jpeg.jpg",
            "language" : null,
            "authority" : null,
            "confidence" : -1,
            "place" : 0
          } ]
        },
        "sizeBytes" : 4825,
        "checkSum" : {
          "checkSumAlgorithm" : "MD5",
          "value" : "78647c1fab73a7aa7c97fdfc538ee6d4"
        },
        "sequenceId" : null,
        "type" : "bitstream",
        "_links" : {
          "content" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/4dd9621f-a464-4192-bc17-d70f68845bdc/content"
          },
          "format" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/4dd9621f-a464-4192-bc17-d70f68845bdc/format"
          },
          "self" : {
            "href" : "https://demo.dspace.org/server/api/core/bitstreams/4dd9621f-a464-4192-bc17-d70f68845bdc"
          }
        }
      }
    ]
  }
}
```

Exposed links:
* primarybitstream: link to the primary bitstream if present, it will be embedded
* bitstreams: link to the list of bitstreams displayed according to the order specified by the bundle, it will be embedded
* item: link to the item
