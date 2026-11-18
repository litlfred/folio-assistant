---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s664-versions
section_title: "Versions"
file: "versionhistory.md"
lines: 55-101
source_sha256: f48fbb000afbfea4
granularity: heading
---
### Versions

**GET /api/versioning/versionhistories/<:versionHistoryId>/versions**

Retrieve a pageable list of versions for the provided version history identifier.  
The versions are ordered by version number descending and attributes are secured as described in the [get single version endpoint](version.md#get-single-version).
Only versions related to archived or withdrawn items are return, the most recent version will be excluded from this list if it is not yet archived.

```json
{
  "_embedded": {
    "versions": [
      {
          "id": "102",
          "version": "2",
          "type": "version",
          "created": "2019-10-31T09:44:46.617",
          "summary": "Author order"
      },
      {
        "id": "101",
        "version": "1",
        "type": "version",
        "created": "2015-11-03T09:44:46.617",
        "summary": "Fixing some typos in the abstract"
      }
    ],
    "_links": {
     "self": {
       "href": "https://demo7.dspace.org/server/api/versioning/versions/search/findByHistory?historyId=1"
     }
    },
    "page": {
     "size": 20,
     "totalElements": 2,
     "totalPages": 1,
     "number": 0
    }
  }
}
```

Return codes:
* 200 OK - if the operation succeeds
* 401 Unauthorized - if you are not authenticated and versioning is not public
* 403 Forbidden - if you are not logged in with sufficient permissions and versioning is not public
