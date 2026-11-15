---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s573-main-endpoint
section_title: "Main Endpoint"
file: "signposting.md"
lines: 10-130
source_sha256: 6151d1e7ad19288a
granularity: heading
---
## Main Endpoint
```/signposting/linksets```

As we don't have yet an use case to iterate over all the existent linksets the main endpoint is not implemented and a 405 error code is returned according to our [general error response codes](README.md#error-codes).

## Single Item linkset

### in application/linkset+json serialization
```/signposting/linksets/<:uuid>/json```

This endpoint provides typed links of item having uuid specified in input and its resources, in application/linkset+json serialization

```json
{
  "linkset": [
    {
      "item": [
        {
          "href": "https://{dspace.ui.url}/bitstreams/{uuid}/download",
          "type": "text/plain"
        },
        {
          "href": "https://{dspace.ui.url}/bitstreams/{uuid}/download",
          "type": "application/pdf"
        }
      ],
      "type": [
        {
          "href": "https://schema.org/AboutPage"
        }
      ],
      "linkset": [
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}",
          "type": "application/linkset"
        },
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}/json",
          "type": "application/linkset+json"
        }
      ],
      "describedby": [
        {
          "href": "https://{dspace.ui.url}/signposting/describedby/{uuid}",
          "type": "application/vnd.datacite.datacite+xml"
        }
      ],
      "cite-as": [
        {
          "href": "https://{dspace.ui.url}/handle/123456789/17"
        }
      ],
      "author": [
        {
          "href": "http://orcid.org/0000-0002-3748-8359",
          "type": "text/html"
        }
      ],
      "license": [
        {
          "href": "http://creativecommons.org/licenses/by/3.0/us/",
          "type": "text/html"
        }
      ],
      "anchor": "https://{dspace.ui.url}/entities/publication/{uuid}",
    },
    {
      "collection": [
        {
          "href": "https://{dspace.ui.url}/entities/publication/{uuid}",
          "type": "text/html"
        }
      ],
      "linkset": [
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}",
          "type": "application/linkset"
        },
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}/json",
          "type": "application/linkset+json"
        }
      ],
      "anchor": "https://{dspace.ui.url}/bitstreams/{uuid}/download"
    },
    {
      "collection": [
        {
          "href": "https://{dspace.ui.url}/entities/publication/{uuid}",
          "type": "text/html"
        }
      ],
      "linkset": [
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}",
          "type": "application/linkset"
        },
        {
          "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}/json",
          "type": "application/linkset+json"
        }
      ],
      "anchor": "https://{dspace.ui.url}/bitstreams/{uuid}/download"
    },
    {
      "describes": [
        {
          "href": "https://{dspace.ui.url}/entities/publication/{uuid}",
          "type": "text/html"
        }
      ],
      "anchor": "https://{dspace.ui.url}/signposting/describedby/{uuid}"
    }
  ]
}
```
Return codes:
* 200 OK - if the operation succeed
* 403 Forbidden - if you are not logged in with sufficient permissions for reading Item information.
* 404 Not found - if the item doesn't exist
