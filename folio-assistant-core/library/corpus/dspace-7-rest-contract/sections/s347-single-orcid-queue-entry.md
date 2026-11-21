---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s347-single-orcid-queue-entry
section_title: "Single ORCID Queue entry"
file: "orcidqueues.md"
lines: 12-40
source_sha256: 6a6cb0b0b43ae012
granularity: heading
---
## Single ORCID Queue entry
**GET /api/eperson/orcidqueues/<:id>**

Provide detailed information about a specific ORCID queue entry. The JSON response document is as follow
```json
{
  "id": 73,
  "profileItemId": "87d24f06-0ca5-4abe-84f9-bfd36a8236d8",
  "entityId": "66e0d773-ddeb-4b6b-bcac-ced2ae67141c",
  "description": "My Publication",
  "recordType": "Publication",
  "operation": "INSERT",
  "type": "orcidqueue",
  "_links": {
    "self": {
      "href": "**/api/eperson/orcidqueues/73"
    }
  }
}
```

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions  (only the owner of the profile is allowed)
* 404 Not found - if an ORCID queue entry with the given id doesn't exist

The `profileItemId` attribute represent the id of the researcher profile item that is associated with the the entity item with id `entityId` that should be sent to the ORCID register.
