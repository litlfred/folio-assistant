---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s565-list-values-of-a-certain-facet
section_title: "List values of a certain facet"
file: "search-endpoint.md"
lines: 716-801
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### List values of a certain facet
**/api/discover/facets/<:facet-name>**

This endpoint returns a list of values that correspond to the given facet name. The result can be refined using the following parameters:
* `query`: The discovery search string to will be used to match records. Please note that this will be treat as a lucene/SOLR query so if special characters need to be literally searched escape them.
* `scope`: UUID of a specific DSpace container (site, community or collection) to which the search has to be limited, e.g. `scope=9076bd16-e69a-48d6-9e41-0238cb40d863`.
* `f.<:filter-name>=<:filter-value>,<:filter-operator>`: Advanced search filter that has to be used to filter the result set. The `filter-name` and `filter-operator` must match a value returned by parent search endpoint (see above). For example `f.author=5df05073-3be7-410d-8166-e254369e4166,authority` or `f.title=rainbows,notcontains`. If the filter operator is absent or invalid a "422 Unprocessable Entity" will be returned.
* `page`, `size` & `sort` [see pagination](README.md#Pagination): the sort name be "count" (results ordered descending by the number of matching records) or "index" (results order alphabetically).

Example: TODO

The returned JSON response will be like:

```json
{
  "query":"my query",
  "scope":"9076bd16-e69a-48d6-9e41-0238cb40d863",
  "appliedFilters": [
      {
        "filter" : "title",
        "operator" : "notcontains",
        "value" : "abcd",
        "label" : "abcd"
      },
      {
        "filter" : "author",
        "operator" : "authority",
        "value" : "1234",
        "label" : "Smith, Donald"
      }
  ],
  "sort" : {
    "by" : "index"
  },
  "page" : {
    	"size": 5,
    	"number": 0
  },
  "name" : "author",
  "facetType": "text",
  "facetLimit": 10,
  "_embedded" : {
    "values" : [
        {
          "label" : "Smith, Donald 2",
          "count" : 100,
          "authorityKey" : "authority_1",
          "_links": {
            "search" : {
              "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+2,equals"
            }
          }
        },
        {
          "label" : "Smith, Donald 1",
          "count" : 80,
          "authorityKey" : "authority_2",
          "_links": {
            "search" : {
              "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+1,equals"
            }
          }
        },
        {
          "label" : "Smith, Donald 3",
          "count" : 10,
          "authorityKey" : "authority_3",
          "_links": {
            "search" : {
              "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+3,equals"
            }
          }
        }
    ]
  },
  "_links": {
      "self": {
        "href": "/api/discover/facets/author?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=0&size=5"
      },
      "next": {
        "href": "/api/discover/facets/author?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=1&size=5"
      }
  }
}
```
