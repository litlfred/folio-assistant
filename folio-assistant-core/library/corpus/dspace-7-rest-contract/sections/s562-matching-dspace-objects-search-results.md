---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s562-matching-dspace-objects-search-results
section_title: "Matching DSpace objects search results"
file: "search-endpoint.md"
lines: 175-420
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### Matching DSpace objects search results
**/api/discover/search/objects**

This endpoint returns a list of DSpace Objects that match the given type. The result can be refined using the following parameters:
* `query`: The discovery search string to will be used to match records. Please note that this will be treated as a Solr/lucene query, which means Solr query syntax is available. However, any special characters must be URL or percent encoded (i.e. %xx).
* `dsoType`: Limit the search to a specific DSpace Object type:
     * all: Execute a query over all available DSO types.
     * item: Only search the DSpace items.
     * community: Search within the DSpace community records.
     * collection: Limit the search to DSpace collection records.
* `scope`: UUID of a specific DSpace container (site, community or collection) to which the search has to be limited, e.g. `scope=9076bd16-e69a-48d6-9e41-0238cb40d863`.
* `configuration`: The name of a Discovery configuration that should be used by this search. If the provided scope already has a specific Discovery configuration defined, than this parameter will be ignored.
* `f.<:filter-name>=<:filter-value>,<:filter-operator>`: Advanced search filter that has to be used to filter the result set. The `filter-name` and `filter-operator` must match a value returned by parent search endpoint (see above). For example `f.author=5df05073-3be7-410d-8166-e254369e4166,authority` or `f.title=rainbows,notcontains`. If the filter operator is absent or invalid a "422 Unprocessable Entity" will be returned.
* `page`, `size` & `sort` [see pagination](README.md#Pagination): the sort name must match a value returned by the parent search endpoint (see above) or *default*, followed by a comma and the order direction. For example `sort=default,asc` or `sort=dateissued,desc`.

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
    "by" : "dc.date.issued",
    "order" : "asc"
  },
  "_embedded" : {
    "searchResults": {
      "_embedded": {
        "objects" : [
          {
            "hitHighlights": {
              "dc.description.abstract" : "This is the <em>very cool</em> abstract of this item",
              "dc.publisher" : "My <em>very cool</em> publisher"
            },
            "_links" : {
              "indexableObject" : {
                "href": "/api/core/items/9f3288b2-f2ad-454f-9f4c-70325646dcee"
              }
            },
            "_embedded" : {
              "indexableObject" : {
                "uuid": "9f3288b2-f2ad-454f-9f4c-70325646dcee",
                "name": "Test Webpage",
                "handle": "10673/4"
              }
            }
          },
          {
            "hitHighlights": { },
            "_links" : {
              "indexableObject" : {
                "href": "/api/core/items/ff7ec3a4-0aab-418b-94fc-d0e8189084db"
              }
            },
            "_embedded" : {
              "indexableObject" : {
                "uuid": "ff7ec3a4-0aab-418b-94fc-d0e8189084db",
                "name": "Test Item with no hit highlights",
                "handle": "10673/5"
              }
            }
          }
        ]
      },
      "_links": {
        "first": {
          "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=0&size=5"
        },
        "self": {
          "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=0&size=5"
        },
        "next": {
          "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=1&size=5"
        },
        "last": {
          "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=2&size=5"
        }
      },
      "page": {
        "number": 0,
        "size": 20,
        "totalElements": 12,
        "totalPages": 3
      }
    },
    "facets": [
      {
        "name" : "author",
        "facetType": "text",
        "facetLimit": 10,
        "_embedded" : {
          "values" : [
            {
              "value" : "Smith, Donald 2",
              "count" : 100,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+2,equals"
              }
            },
            {
              "value" : "Smith, Donald 1",
              "count" : 80,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+1,equals"
              }
            },
            {
              "value" : "Smith, Donald 3",
              "count" : 10,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+3,equals"
              }
            }
          ]
        },
        "_links": {
          "self": {
            "href": "/api/discover/facets/author?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
          }
        }
      },{
        "name" : "subject",
        "facetType": "hierarchical",
        "facetLimit": 10,
        "_embedded" : {
          "values" : [
            {
              "value" : "Java",
              "count" : 100,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=Java"
              }
            },
            {
              "value" : "SQL",
              "count" : 80,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=SQL"
              }
            },
            {
              "value" : "CSS",
              "count" : 10,
              "_links": {
                "search" : "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=CSS"
              }
            }
          ]
        },
        "_links": {
          "self": {
            "href": "/api/discover/facets/subject?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
          }
        }
      },{
        "name": "dateIssued",
        "facetType": "date",
        "facetLimit": 10,
        "minValue": "1940-03-15",
        "maxValue": "2017-11-06",
        "_links": {
          "self": {
            "href": "/api/discover/facets/dateIssued?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
          }
        },
        "page": {
          "number": 0,
          "size": 10
        },
        "_embedded": {
          "values": [
            {
              "label": "1940 - 1959",
              "count": 23370,
              "type": "discover",
              "_links": {
                "search": {
                  "href": "http://dspace7-internal.atmire.com/rest/api/discover/search/objects?f.dateIssued=[1940 TO 1959],equals"
                }
              }
            },
            {
              "label": "1960 - 1979",
              "count": 45044,
              "type": "discover",
              "_links": {
                "search": {
                  "href": "http://dspace7-internal.atmire.com/rest/api/discover/search/objects?f.dateIssued=[1960 TO 1979],equals"
                }
              }
            },
            {
              "label": "1980 - 1999",
              "count": 56128,
              "type": "discover",
              "_links": {
                "search": {
                  "href": "http://dspace7-internal.atmire.com/rest/api/discover/search/objects?f.dateIssued=[1980 TO 1999],equals"
                }
              }
            },
            {
              "label": "2000 - 2017",
              "count": 51707,
              "type": "discover",
              "_links": {
                "search": {
                  "href": "http://dspace7-internal.atmire.com/rest/api/discover/search/objects?f.dateIssued=[2000 TO 2017],equals"
                }
              }
            }
          ]
        }
      }
    ]  
  },
  "_links": {
    "self": {
      "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=0&size=5"
    },
    "facets": {
      "href": "/api/discover/search/facets?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
    },
    "objects": {
      "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=0&size=5"
    }
  }
}
```
