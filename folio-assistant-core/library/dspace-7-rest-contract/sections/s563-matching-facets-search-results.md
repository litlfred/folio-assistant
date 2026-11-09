---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s563-matching-facets-search-results
section_title: "Matching Facets search results"
file: "search-endpoint.md"
lines: 421-630
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### Matching Facets search results
**/api/discover/search/facets**

This endpoint returns a list of configured facets with their respective values. The result can be refined using the following parameters:
* `query`: The discovery search string to will be used to match records. Please note that this will be treat as a lucene/SOLR query so if special characters need to be literally searched escape them.
* `dsoType`: Limit the search to a specific or multiple DSpace Object types. This field is repeatable to define multiple types:
     * all: Execute a query over all available DSO types.
     * item: Only search the DSpace items.
     * community: Search within the DSpace community records.
     * collection: Limit the search to DSpace collection records.
* `scope`: UUID of a specific DSpace container (site, community or collection) to which the search has to be limited, e.g. `scope=9076bd16-e69a-48d6-9e41-0238cb40d863`.
* `configuration`: The name of a Discovery configuration that should be used by this search. If the provided scope already has a specific Discovery configuration defined, than this parameter will be ignored.
* `f.<:filter-name>=<:filter-value>,<:filter-operator>`: Advanced search filter that has to be used to filter the result set. The `filter-name` and `filter-operator` must match a value returned by parent search endpoint (see above). For example `f.author=5df05073-3be7-410d-8166-e254369e4166,authority` or `f.title=rainbows,notcontains`. If the filter operator is absent or invalid a "422 Unprocessable Entity" will be returned.
* `page`, `size` & `sort` [see pagination](README.md#Pagination): the sort name must match a value returned by the parent search endpoint (see above) or *default*, followed by a comma and the order direction. For example `sort=default,asc` or `sort=dateissued,desc`.

Some facets can be configured in the `discovery.xml` file to expose minimum and maximum values. In the example below the `dateIssued` filter has this configuration enabled.

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
  "page": {
    	"size": 5,
    	"totalElements": 14,
    	"totalPages": 3,
    	"number": 0
  },
  "_embedded" : {
    "facets" : [
      {
        "name" : "author",
        "facetType": "text",
        "facetLimit": 5,
        "_links": {
          "next" : {
            "href": "/api/discover/facets/author?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=1&size=5"
          },
          "self" : {
            "href":  "/api/discover/facets/author?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
          }
        },
        "page": {
          "number": 0,
          "size": 5
        },
        "_embedded" : {
          "values" : [
              {
                "label" : "Smith, Donald 2",
                "count" : 100,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+2,equals"
                  }
                }
              },
              {
                "label" : "Smith, Donald 1",
                "count" : 80,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+1,equals"
                  }
                }
              },
              {
                "label" : "Smith, Donald 3",
                "count" : 10,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&f.author=Smith,+Donald+3,equals"
                  }
                }
              }
          ]
        }
      },
      {
        "name" : "subject",
        "facetType": "text",
        "facetLimit": 5,
        "_links": {
          "next" : {
            "href": "/api/discover/facets/subject?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&page=1&size=5"
          },
          "self" : {
            "href":  "/api/discover/facets/subject?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority"
          }
        },
        "page": {
          "number": 0,
          "size": 5
        },
        "_embedded" : {
          "values" : [
              {
                "label" : "Java",
                "count" : 100,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=Java"
                  }
                }
              },
              {
                "label" : "SQL",
                "count" : 80,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=Java"
                  }
                }
              },
              {
                "label" : "CSS",
                "count" : 10,
                "_links": {
                  "search" : {
                    "href": "/api/discover/search/objects?query=my+query&scope=9076bd16-e69a-48d6-9e41-0238cb40d863&f.title=abcd,notcontains&f.author=1234,authority&subject.equals=Java"
                  }
                }
              }
          ]
        }
      },
      {
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
  }
}
```
