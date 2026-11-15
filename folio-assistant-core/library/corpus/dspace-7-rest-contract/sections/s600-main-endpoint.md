---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s600-main-endpoint
section_title: "Main Endpoint"
file: "submissioncclicenses.md"
lines: 8-41
source_sha256: e669ef3bc887c7ff
granularity: heading
---
## Main Endpoint
**/api/config/submissioncclicenses**   

Provide access to the potential licenses for the CC license. It returns the list of configured CC licenses.

This will correspond to e.g. https://api.creativecommons.org/rest/1.5/ filtered to only include the licenses which are configured for this repository

```json
{
  "_embedded": {
    "submissioncclicenses": [
      {
        "id": "publicdomain",
        "name": "Public Domain",
        "type": "submissioncclicenses",
        "fields": []
      },
      {
        "id": "mark",
        "name": "Public Domain Mark",
        "type": "submissioncclicenses",
        "fields": []
      }
    ]
  },
  "page": {
    "size": 20,
    "totalElements": 2,
    "totalPages": 1,
    "number": 0
  }
}
```
