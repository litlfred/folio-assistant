---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s567-workspace
section_title: "workspace"
file: "search-endpoint.md"
lines: 804-1128
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### workspace
This configuration is used to retrieve all the submission done by the current user regardless to the status that they have reached (i.e. it returns workspaceitems, workflowtems and archived items).

Example

```
{
  "id" : null,
  "scope" : null,
  "query" : null,
  "appliedFilters" : null,
  "sort" : null,
  "configuration" : "workspace",
  "type" : "discover",
  "_links" : {
    "self" : {
      "href" : "https://demo.dspace.org/server/api/discover/search/objects?configuration=workspace"
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
              "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8"
            }
          },
          "_embedded" : {
            "indexableObject" : {
              "id" : 8,
              "lastModified" : "2019-03-07T18:19:45.187+0000",
              "sections" : {
                "license" : {
                  "url" : null,
                  "acceptanceDate" : null,
                  "granted" : false
                },
                "upload" : {
                  "files" : [ ]
                },
                "collection" : "4631161d-9c72-4556-b554-15e0db82628d",
                "traditionalpagetwo" : { },
                "traditionalpageone" : {
                  "dc.title" : [ {
                    "value" : "Admin Workspace Item 1",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ],
                  "dc.date.issued" : [ {
                    "value" : "2010-07-23",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ]
                }
              },
              "type" : "workspaceitem",
              "_links" : {
                "collection" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8/collection"
                },
                "item" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8/item"
                },
                "submissionDefinition" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8/submissionDefinition"
                },
                "submitter" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8/submitter"
                },
                "self" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/8"
                }
              },
              "_embedded" : {
                "submitter" : {
					...
                },
                "item" : {
                  	...
                },
                "submissionDefinition" : {
                		...
                },
                "collection" : {
					...
	  		   }
  		     }
        }, {
          "hitHighlights" : null,
          "type" : "discover",
          "_links" : {
            "indexableObject" : {
              "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9"
            }
          },
          "_embedded" : {
            "indexableObject" : {
              "id" : 9,
              "lastModified" : "2019-03-07T18:19:45.245+0000",
              "sections" : {
                "license" : {
                  "url" : null,
                  "acceptanceDate" : null,
                  "granted" : false
                },
                "upload" : {
                  "files" : [ ]
                },
                "collection" : "e1a05a4b-0a5f-4aec-9f18-a01b1080dab1",
                "traditionalpagetwo" : { },
                "traditionalpageone" : {
                  "dc.title" : [ {
                    "value" : "Admin Workspace Item 2",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ],
                  "dc.date.issued" : [ {
                    "value" : "2010-11-03",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ]
                }
              },
              "type" : "workspaceitem",
              "_links" : {
                "collection" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9/collection"
                },
                "item" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9/item"
                },
                "submissionDefinition" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9/submissionDefinition"
                },
                "submitter" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9/submitter"
                },
                "self" : {
                  "href" : "https://demo.dspace.org/server/api/submission/workspaceitems/9"
                }
              },
              "_embedded" : {
                "submitter" : {
					...
                },
                "item" : {
                  	...
                },
                "submissionDefinition" : {
                		...
                },
                "collection" : {
					...
	  		   }
  		     }
        }, {
          "hitHighlights" : null,
          "type" : "discover",
          "_links" : {
            "indexableObject" : {
              "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3"
            }
          },
          "_embedded" : {
            "indexableObject" : {
              "id" : 3,
              "lastModified" : "2019-03-07T18:19:45.282+0000",
              "sections" : {
                "license" : {
                  "url" : null,
                  "acceptanceDate" : null,
                  "granted" : false
                },
                "upload" : {
                  "files" : [ ]
                },
                "collection" : "e1a05a4b-0a5f-4aec-9f18-a01b1080dab1",
                "traditionalpagetwo" : { },
                "traditionalpageone" : {
                  "dc.title" : [ {
                    "value" : "Admin Workflow Item 1",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ],
                  "dc.date.issued" : [ {
                    "value" : "2010-11-03",
                    "language" : "*",
                    "authority" : null,
                    "confidence" : -1
                  } ]
                }
              },
              "type" : "workflowitem",
              "_links" : {
                "collection" : {
                  "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3/collection"
                },
                "item" : {
                  "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3/item"
                },
                "submissionDefinition" : {
                  "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3/submissionDefinition"
                },
                "submitter" : {
                  "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3/submitter"
                },
                "self" : {
                  "href" : "https://demo.dspace.org/server/api/workflow/workflowitems/3"
                }
              },
			"_embedded" : {
                "submitter" : {
					...
                },
                "item" : {
                  	...
                },
                "submissionDefinition" : {
                		...
                },
                "collection" : {
					...
	  		   }
  		     }
           }
        } ]
      },
      "_links" : {
        "self" : {
          "href" : "https://demo.dspace.org/server/api/discover/search/objects?configuration=workspace"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 20,
        "totalPages" : 1,
        "totalElements" : 3
      }
    },
    "facets" : [ {
      "name" : "namedresourcetype",
      "facetType" : "text",
      "facetLimit" : 10,
      "_links" : {
        "self" : {
          "href" : "https://demo.dspace.org/server/api/discover/facets/namedresourcetype?configuration=workspace"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 10
      },
      "_embedded" : {
        "values" : [ {
          "label" : "Workspace",
          "count" : 2,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "https://demo.dspace.org/server/api/discover/search/objects?configuration=workspace&f.namedresourcetype=workspace,authority"
            }
          }
        }, {
          "label" : "Workflow",
          "count" : 1,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "https://demo.dspace.org/server/api/discover/search/objects?configuration=workspace&f.namedresourcetype=workflow,authority"
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
          "href" : "https://demo.dspace.org/server/api/discover/facets/itemtype?configuration=workspace"
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
          "href" : "https://demo.dspace.org/server/api/discover/facets/dateIssued?configuration=workspace"
        }
      },
      "page" : {
        "number" : 0,
        "size" : 5
      },
      "_embedded" : {
        "values" : [ {
          "label" : "2010",
          "count" : 3,
          "type" : "discover",
          "_links" : {
            "search" : {
              "href" : "https://demo.dspace.org/server/api/discover/search/objects?configuration=workspace&f.dateIssued=2010,equals"
            }
          }
        } ]
      }
    } ]
  }
}
```
