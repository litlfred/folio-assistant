---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s561-search-endpoint
section_title: "Search Endpoint"
file: "search-endpoint.md"
lines: 4-174
source_sha256: 486eaa0ab837bfe0
granularity: heading
---
## Search Endpoint
**/api/discover/search**   

This endpoint provides the functionality of the Discovery search screen: https://wiki.duraspace.org/display/DSDOC7x/Discovery.
It will provide detailed information on the Discovery search configuration that can be used to build complex searches.

It supports the following parameters:
* `scope`: UUID of a specific DSpace container (site, community or collection) to which the search will to be limited. If the scope has a specific DSpace configuration defined in `config/spring/api/discovery.xml`[https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L28] that configuration will be returned. Otherwise the default configuration will be returned.
* `configuration`: The name of a Discovery configuration that should be used by this search. If the provided scope already has a specific Discovery configuration defined, than this parameter will be ignored. Two special configurations always exists *workspace* and *workflow*. These configuration are used by the MyDSpace functionality, more details at the bottom of this page.

The JSON response document is as follow
```json
{
  "filters": [
    {
      "filter" : "title",
      "hasFacets": false,
      "type": "text",
      "operators": [
        {
          "operator": "equals"
        },
        {
          "operator": "notequals"
        },
        {
          "operator": "authority"
        },
        {
          "operator": "notauthority"
        },
        {
          "operator": "contains"
        },
        {
          "operator": "notcontains"
        }
      ],
      "openByDefault": false
    },
    {
      "filter" : "author",
      "hasFacets": true,
      "type": "text",
      "operators": [
        {
          "operator": "equals"
        },
        {
          "operator": "notequals"
        },
        {
          "operator": "authority"
        },
        {
          "operator": "notauthority"
        },
        {
          "operator": "contains"
        },
        {
          "operator": "notcontains"
        }
      ],
      "openByDefault": true
    },
    {
      "filter": "subject",
      "hasFacets": true,
      "type": "hierarchical",
      "operators": [
        {
          "operator": "equals"
        },
        {
          "operator": "notequals"
        },
        {
          "operator": "authority"
        },
        {
          "operator": "notauthority"
        },
        {
          "operator": "contains"
        },
        {
          "operator": "notcontains"
        }
      ],
      "openByDefault": false
    },
    {
      "filter": "dateIssued",
      "hasFacets": true,
      "type": "date",
      "operators": [
        {
          "operator": "equals"
        },
        {
          "operator": "notequals"
        },
        {
          "operator": "authority"
        },
        {
          "operator": "notauthority"
        },
        {
          "operator": "contains"
        },
        {
          "operator": "notcontains"
        }
      ],
      "openByDefault": false
    },
    {
      "filter": "has_content_in_original_bundle",
      "hasFacets": true,
      "type": "standard",
      "operators": [
        {
          "operator": "equals"
        },
        {
          "operator": "notequals"
        },
        {
          "operator": "authority"
        },
        {
          "operator": "notauthority"
        },
        {
          "operator": "contains"
        },
        {
          "operator": "notcontains"
        }
      ],
      "openByDefault": false
    }
  ],
  "sortOptions": [
    {
      "name": "score"
    },
    {
      "name": "dc.title"
    },
    {
      "name": "dc.date.issued"
    },
    {
      "name": "dc.date.accessioned"
    }
  ],
  "type": "discover"
}
```

* filters: Provides a list of advanced search filters that can be used to limit the result set as configured in https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L97
* operators: A list of supported operators that can be combined on each search filter.
* sortOptions: The sort options available for this query type as configured in https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L112

Exposed links:
* objects: link to get the actual list of objects that match the search query
* facets: link to get the list of facet values and counts associated with this search query as configured in https://github.com/DSpace/DSpace/blob/master/dspace/config/spring/api/discovery.xml#L86
