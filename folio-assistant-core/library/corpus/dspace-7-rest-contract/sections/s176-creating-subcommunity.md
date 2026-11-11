---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s176-creating-subcommunity
section_title: "Creating subCommunity"
file: "communities.md"
lines: 356-383
source_sha256: 91351bf44765781b
granularity: heading
---
### Creating subCommunity

**POST /api/core/communities?parent=<:communityUUID>**

To create a sub level community, perform as post with the JSON below to the communities endpoint when logged in as admin.

```json
{
  "name": "test subcommunity",
  "metadata": {
    "dc.title": [
      {
        "value": "test subcommunity",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  }
}
```

Error messages:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 UNPROCESSABLE ENTITY - if the parent community doesn't exist (the REST URI /api/core/communities still exists)
