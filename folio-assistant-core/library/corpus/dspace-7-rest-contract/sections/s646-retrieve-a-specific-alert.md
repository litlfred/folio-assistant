---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s646-retrieve-a-specific-alert
section_title: "Retrieve a specific alert"
file: "systemwidealerts.md"
lines: 21-48
source_sha256: 61bf56c22237aae7
granularity: heading
---
## Retrieve a specific alert
**GET /api/system/systemwidealerts/<:alert-id>**
This endpoint returns a single system-wide alert by its integer identifier.
If the alert in question is inactive, it will only be exposed to admin users. 
For other users it will appear as if no alert exists for the given identifier.

Example response:
```json
{
  "alertId" : 1,
  "message" : "This message will show up in the banner",
  "allowSessions" : "all",
  "countdownTo" : "2023-04-05T00:00:00.000+00:00",
  "active" : true,
  "type" : "systemwidealert",
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/server/api/system/systemwidealerts/1"
    }
  }
}
```

Status codes:
* 200 OK - if the operation succeeded 
* 404 Unauthorized - if the requested alert is inactive and the user is not an admin
