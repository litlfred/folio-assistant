---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s568-workflow
section_title: "workflow"
file: "search-endpoint.md"
lines: 1129-1342
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### workflow
This configuration is used to retrieve all the tasks relevant for the current user. This mean pool tasks that can be claimed or already claimed tasks.
Example
```
{
  "id" : null,
  "scope" : null,
  "query" : null,
  "appliedFilters" : null,
  "sort" : null,
  "configuration" : "workflow",
  "type" : "discover",
  "_links" : {
    "self" : {
      "href" : "http://localhost/api/discover/search/objects?configuration=workflow"
    }
  },
  "_embedded" : {
    "searchResult" : {
      "_embedded" : {
        "objects" : [ {
          "hitHighlights" : null,
          "type" : "discover",
          "_links" : {
            "indexableObject" : {
              "href" : "http://localhost/api/workflow/pooltasks/1"
            }
          },
          "_embedded" : {
            "indexableObject" : {
              "id" : 1,
              "step" : "reviewstep",
              "action" : "claimaction",
              "type" : "pooltask",
              "_links" : {
                "eperson" : {
                  "href" : "http://localhost/api/workflow/pooltasks/1/eperson"
                },
                "group" : {
                  "href" : "http://localhost/api/workflow/pooltasks/1/group"
                },
                "workflowitem" : {
                  "href" : "http://localhost/api/workflow/pooltasks/1/workflowitem"
                },
                "self" : {
                  "href" : "http://localhost/api/workflow/pooltasks/1"
                }
              },
              "_embedded" : {
                "eperson" : null,
                "group" : {
                	...
                },
                "workflowitem" : {
                  	...
                }
              }
            }
          }
        }, {
          "hitHighlights" : null,
          "type" : "discover",
          "_links" : {
            "indexableObject" : {
              "href" : "http://localhost/api/workflow/pooltasks/3"
            }
          },
          "_embedded" : {
            "indexableObject" : {
              "id" : 3,
              "step" : "reviewstep",
              "action" : "claimaction",
              "type" : "pooltask",
              "_links" : {
                "eperson" : {
                  "href" : "http://localhost/api/workflow/pooltasks/3/eperson"
                },
                "group" : {
                  "href" : "http://localhost/api/workflow/pooltasks/3/group"
                },
                "workflowitem" : {
                  "href" : "http://localhost/api/workflow/pooltasks/3/workflowitem"
                },
                "self" : {
                  "href" : "http://localhost/api/workflow/pooltasks/3"
                }
              },
              "_embedded" : {
                "eperson" : null,
                "group" : {
                 	...
                },
                "workflowitem" : {
					...
                }
              }
            }
          }
        } ]
      },
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/discover/search/objects?configuration=workflow"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 20,
        "totalPages" : 1,
        "totalElements" : 2
      }
    },
    "facets" : [ {
      "name" : "namedresourcetype",
      "facetType" : "text",
      "facetLimit" : 10,
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/discover/facets/namedresourcetype?configuration=workflow"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 10
      },
      "_embedded" : {
        "values" : [ {
          "label" : "Waiting for Controller",
          "count" : 2,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "http://localhost/api/discover/search/objects?configuration=workflow&f.namedresourcetype=waitingforcontroller,authority"
            }
          }
        } ]
      }
    }, {
      "name" : "itemtype",
      "facetType" : "text",
      "facetLimit" : 10,
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/discover/facets/itemtype?configuration=workflow"
        }
      },
      "_embedded" : {
        "values" : [ ]
      }
    }, {
      "name" : "dateIssued",
      "facetType" : "date",
      "facetLimit" : 5,
      "minValue" : "1990-02-13",
      "maxValue" : "2010-11-03",
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/discover/facets/dateIssued?configuration=workflow"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 5
      },
      "_embedded" : {
        "values" : [ {
          "label" : "2010",
          "count" : 2,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "http://localhost/api/discover/search/objects?configuration=workflow&f.dateIssued=2010,equals"
            }
          }
        } ]
      }
    }, {
      "name" : "submitter",
      "facetType" : "text",
      "facetLimit" : 10,
      "_links" : {
        "self" : {
          "href" : "http://localhost/api/discover/facets/submitter?configuration=workflow"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 10
      },
      "_embedded" : {
        "values" : [ {
          "label" : "first (admin) last (admin)",
          "count" : 1,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "http://localhost/api/discover/search/objects?configuration=workflow&f.submitter=9ad6a949-9f4f-4504-8a5a-881274ac0bc3,authority"
            }
          }
        }, {
          "label" : "first last",
          "count" : 1,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "http://localhost/api/discover/search/objects?configuration=workflow&f.submitter=014186a8-aae1-45e9-879e-48416acd6248,authority"
            }
          }
        } ]
      }
    } ]
  }
}
```
