---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s438-scripts-endpoint
section_title: "Scripts Endpoint"
file: "scripts-endpoint.md"
lines: 6-47
source_sha256: f015bdfaa9a025e1
granularity: heading
---
## Scripts Endpoint
**GET /api/system/scripts**

This endpoint will list all (REST supported) scripts defined in `dspace/config/spring/rest/scripts.xml`. The script entries are embedded with a name, description and a self link. By "REST supported" we mean all scripts that have been updated to allow invocations from the REST API.

The JSON response document is as follows
```json
{
  "page": {
      	"size": 5,
      	"totalElements": 14,
      	"totalPages": 3,
      	"number": 0
  },
  "_embedded" : {
    "scripts" : [
      {
        "id" : "import",
        "name" : "import",
        "type" : "script",
        "description" : "Import items into DSpace",
        "_links" : {
          "self" : {
            "href" : "/api/system/scripts/import"
          }
        }
      },
      {
        "name" : "metadata-import",
        "type" : "script",
        "description" : "Import metadata after batch editing",
        "_links" : {
          "self" : {
            "href" : "/api/system/scripts/metadata-import"
          }
        }
      }
    ]
  }
}
```
