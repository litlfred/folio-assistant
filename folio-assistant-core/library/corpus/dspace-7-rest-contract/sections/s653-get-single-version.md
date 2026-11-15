---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s653-get-single-version
section_title: "Get single version"
file: "version.md"
lines: 47-83
source_sha256: 5a33997dae698af1
granularity: heading
---
## Get single version

**GET /api/versioning/versions/<:versionId>**

Provide the version information associated to a specific id. The returned attributes depend on the user permissions and system configuration.
The following example shows all the available attributes as exposed to an administrator

```json
{
  "id": "345",
  "version": "101",
  "type": "version",
  "created": "2015-11-03T09:44:46.617",
  "summary": "Fixing some typos in the abstract",
  "submitterName": "LastName, FirstName",
  "_links": {
    "versionhistory": {
      "href": "https://demo7.dspace.org/server/api/versioning/versionhistories/1"
    },
    "self": {
      "href": "https://demo7.dspace.org/server/api/versioning/versions/345"
    },
    "item": {
      "href": "https://demo7.dspace.org/server/api/versioning/versions/345/item"
    }
  }
}         
```

The `submitterName` attribute is only exposed if you are logged in as an administrator of the linked item or if the `versioning.item.history.include.submitter` configuration property is set to true.

Status codes:
* 200 OK - if the version exists and is accessible by the current user
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
* 404 Not found - if the version doesn't exist or was deleted
