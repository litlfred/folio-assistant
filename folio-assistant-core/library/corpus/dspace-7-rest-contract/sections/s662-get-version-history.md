---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s662-get-version-history
section_title: "Get version history"
file: "versionhistory.md"
lines: 20-52
source_sha256: f48fbb000afbfea4
granularity: heading
---
## Get version history

**GET /api/versioning/versionhistories/<:versionHistoryId>**

Provide information about for a version history id.

```json
{
  "id": "1",
  "draftVersion": false,
  "type": "versionhistory",  
  "_links": {
    "self": {
      "href": "https://demo7.dspace.org/server/api/versioning/versionhistories/1"
    },
    "versions": {
      "href": "https://demo7.dspace.org/server/api/versioning/versionhistories/1/versions"
    },
    "draftVersion": {
      "href": "https://demo7.dspace.org/server/api/versioning/versionhistories/1/draftVersion"
    }
  }
}
```
Attributes:
- draftVersion: true, if the most recent version is associated to an item still in progress (workspace or workflow), false otherwise. This attribute is only visible to users allowed to create a new version in the history, see [Create version endpoint](version.md#Create version) 

Status codes:
* 200 OK - if the version history exists and is accessible by the current user
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
* 404 Not found - if you have the permission to review the version history and it doesn't exist
