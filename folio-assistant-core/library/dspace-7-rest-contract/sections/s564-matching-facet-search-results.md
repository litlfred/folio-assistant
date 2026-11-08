---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s564-matching-facet-search-results
section_title: "Matching facet search results"
file: "search-endpoint.md"
lines: 631-715
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
### Matching facet search results
**/api/discover/facets**

Provide access to the Discovery facet system (SOLR based). This endpoint returns the list of available facet fields that can be queried. The endpoint supports the following parameters:
* `scope`: UUID of a specific DSpace container (site, community or collection) to which the search will to be limited. If the scope has a specific DSpace configuration defined in `config/spring/api/discovery.xml`[https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L28] that configuration will be returned. Otherwise the default configuration will be returned.
* `configuration`: The name of a Discovery configuration that should be used by this search. If the provided scope already has a specific Discovery configuration defined, than this parameter will be ignored.

The list of returned facet fields will depend on the Discovery configuration: https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L86

The JSON response document is as follow
```json
{
  "id": null,
  "scope": null,
  "query": null,
  "appliedFilters": null,
  "sort": null,
  "configurationName": null,
  "type": "discover",
  "_links": {
    "first": {
      "href": "/api/discover/search/facets?page=0&size=10"
    },
    "self": {
      "href": "/api/discover/search/facets"
    },
    "next": {
      "href": "/api/discover/search/facets?page=1&size=10"
    },
    "last": {
      "href": "/api/discover/search/facets?page=9&size=10"
    }
  },
  "page" : {
    "size": 10,
    "number": 0
  },  
  "_embedded": {
    "facets": [
      {
        "name" : "author",
        "facetType": "text",
        "facetLimit": 10,
        "_links": {
          "self": {
            "href": "/api/discover/facets/author"
          }
        }   
      },
      {
        "name" : "subject",
        "facetType": "hierarchical",
        "facetLimit": 10,
        "_links": {
          "self": {
            "href": "/api/discover/facets/subject"
          }
        }
      },
      {
        "name" : "dateIssued",
        "facetType": "date",
        "facetLimit": 10,
        "hasMinMaxValues": true,
        "_links": {
          "self": {
            "href": "https://demo.dspace.org/server/api/discover/facets/dateissued"
          }
        }
      },
      {
        "name" : "has_content_in_original_bundle",
        "facetType": "standard",
        "facetLimit": 2,
        "_links": {
          "self": {
            "href": "https://demo.dspace.org/server/api/discover/facets/has_content_in_original_bundle"
          }
        }
      }
    ]
  }
}
```
