---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s677-top
section_title: "top"
file: "vocabularyEntryDetails.md"
lines: 63-167
source_sha256: 6d0ee33dcbc81ad3
granularity: heading
---
### top
**/api/submission/vocabularyEntryDetails/search/top?vocabulary=<:vocabulary-id>**

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* vocabulary: the id of the vocabulary to query. It must be an hierarchical vocabulary

Return codes:
* 200 OK - if the operation succeed
* 400 Bad Request - if the vocabulary parameter is missing or invalid
* 401 Unauthorized - if you are not authenticated
* 422 Unprocessable Entity - if the specified vocabulary exists but it is not an hierarchical vocabulary

Provide detailed information about all top entries of a specific hierarchical vocabulary. The JSON response document is as follow

-- this one represent top entries of "srsc" vocabulary
```json, 
{
      "id" : "srsc:SCB11",
      "value" : "HUMANITIES and RELIGION",
      "selectable" : true,
      "otherInformation" : {
          "id": "SCB11",
          "note" : "HUMANIORA och RELIGIONSVETENSKAP",
          "hasChildren": "true"
      },
      "type" : "vocabularyEntryDetail",
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB11"
        },
        "vocabulary" : {
          "href" : "http://localhost/api/submission/vocabularies/srsc"
        },
        "parent" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB11/parent"
        },
        "children" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB11/children"
        },
      }
    }, {
      "id" : "srsc:SCB12",
      "value" : "LAW/JURISPRUDENCE",
      "selectable" : true,
      "otherInformation" : {
        "id" : "SCB12",
        "note" : "RÄTTSVETENSKAP/JURIDIK",
        "hasChildren" : "true"
      },
      "type" : "vocabularyEntryDetail",
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB12"
        },
        "vocabulary" : {
          "href" : "http://localhost/api/submission/vocabularies/srsc"
        },
        "parent" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB12/parent"
        },
        "children" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB12/children"
        },
      }
    }, 
    ..., 
    {
      "id" : "srsc:SCB23",
      "value" : "INTERDISCIPLINARY RESEARCH AREAS",
      "selectable" : true,
      "otherInformation" : {
        "id" : "SCB23",
        "note" : "TVÄRVETENSKAPLIGA FORSKNINGSOMRÅDEN",
        "hasChildren" : "true"
      },
      "type" : "vocabularyEntryDetail",
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB23"
        },
        "vocabulary" : {
          "href" : "http://localhost/api/submission/vocabularies/srsc"
        },
        "parent" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB23/parent"
        },
        "children" : {
          "href" : "http://localhost/api/submission/vocabularyEntryDetails/srsc:SCB23/children"
        },
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost/api/submission/vocabularyEntryDetails/search/top?vocabulary=srsc"
    }
  },
  "page" : {
    "size" : 20,
    "totalElements" : 12,
    "totalPages" : 1,
    "number" : 0
  }
```
