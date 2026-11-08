---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s265-main-endpoint
section_title: "Main Endpoint"
file: "harvestermetadata.md"
lines: 4-39
source_sha256: 0e5cb7f0461608ad
granularity: heading
---
## Main Endpoint
**/api/config/harvestermetadata**   

Provide access to the list of harvesting metadata configurations (config based).

Example: <https://demo.dspace.org/server/#/server/api/config/harvestermetadata>


A sample json response:

```json
{
  "configs": [
    {
       "id": "dc",
       "label": "Simple Dublin Core",
       "nameSpace": "http://www.openarchives.org/OAI/2.0/oai_dc/"
    },
    {
       "id": "qdc",
       "label": "Qualified Dublin Core",
       "nameSpace": "http://purl.org/dc/terms/"
    },
    {
       "id": "dim",
       "label": "DSpace Intermediate Metadata",
       "nameSpace": "http://www.dspace.org/xmlns/dspace/dim"
    }
  ],
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/config/harvestermetadata"
    }
  }
}
```
