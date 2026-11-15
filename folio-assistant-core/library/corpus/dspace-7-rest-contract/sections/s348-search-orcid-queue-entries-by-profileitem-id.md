---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s348-search-orcid-queue-entries-by-profileitem-id
section_title: "Search ORCID Queue entries by profileItem id"
file: "orcidqueues.md"
lines: 41-97
source_sha256: 6a6cb0b0b43ae012
granularity: heading
---
## Search ORCID Queue entries by profileItem id
**GET /api/eperson/orcidqueues/search/findByProfileItem?profileItemId=<:item-uuid>**

Provide detailed information about all the ORCID queue entries related to the profileItem with the given uuid. The JSON response document is as follow
```json
{
  "_embedded": {
    "orcidQueues": [
      {
        "id": 68,
        "profileItemId": "87d24f06-0ca5-4abe-84f9-bfd36a8236d8",
        "entityId": "3eed1cf2-552d-491a-9a1f-ef941a0cafcd",
        "description": "ABC-54321",
        "recordType": "Project",
        "operation": "UPDATE",
        "type": "orcidQueue",
        "_links": {
          "self": {
            "href": "**/api/eperson/orcidqueues/68"
          }
        }
      },
      {
        "id": 73,
        "profileItemId": "87d24f06-0ca5-4abe-84f9-bfd36a8236d8",
        "entityId": "66e0d773-ddeb-4b6b-bcac-ced2ae67141c",
        "description": "My Publication",
        "recordType": "Publication",
        "operation": "DELETE",
        "type": "orcidQueue",
        "_links": {
          "self": {
            "href": "**/api/eperson/orcidqueues/73"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "http://localhost:8080/server/api/eperson/orcidQueues/search/findByProfileItem"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 2,
    "totalPages": 1,
    "number": 0
  }
}
```

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions (only the owner of the profile is allowed)
