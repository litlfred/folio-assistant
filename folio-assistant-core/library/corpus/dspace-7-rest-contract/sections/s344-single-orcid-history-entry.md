---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s344-single-orcid-history-entry
section_title: "Single ORCID History entry"
file: "orcidhistories.md"
lines: 12-41
source_sha256: d53f90e5dbc2260a
granularity: heading
---
## Single ORCID History entry
**GET /api/eperson/orcidhistories/<:id>**

Provide detailed information about a specific ORCID history entry. The JSON response document is as follow
```json
{
  "id": 20,
  "profileItemId": "87d24f06-0ca5-4abe-84f9-bfd36a8236d8",
  "entityId": "66e0d773-ddeb-4b6b-bcac-ced2ae67141c",
  "status": "201",
  "putCode": "123456",
  "responseMessage": "<xml><work>...</work>",
  "timestamp": "2014-01-01T23:28:56.782Z", 
  "type": "orcidhistory",
  "_links": {
    "self": {
      "href": "**/api/eperson/orcidhistories/20"
    }
  }
}
```

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions (only the owner of the profile is allowed)
* 404 Not found - if an ORCID queue entry with the given id doesn't exist

The `profileItemId` attribute represent the id of the researcher profile item that is associated with the the entity item with id `entityId`; the entity is the item that should be sent to the ORCID register. The `putCode` attribute, if presente, represent the unique code that ORCID registry associate to the stored entity. The `status` attribute is the response status of the related call to ORCID to send the entity. The `responseMessage` is the complete response body coming from the ORCID api when the call to send the entity is made. The `lastAttempt` and the `sucessAttempt` are two timestamps that represent respectively the last attempt to send the entity info to ORCID and the last moment in which that send was successful.
