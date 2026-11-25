---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s648-create-a-new-alert
section_title: "Create a new alert"
file: "systemwidealerts.md"
lines: 60-88
source_sha256: 61bf56c22237aae7
granularity: heading
---
## Create a new alert
**POST /api/system/systemwidealerts**
This endpoint allows administrators to create a new system-wide alert.

Example request:
```json
{
  "message": "Alert message to show in the banner",
  "allowSessions": "admin",
  "countdownTo": "2023-04-05T00:00:00.000Z",
  "active": true
}
```

The value of `countdownTo` must be a UTC datetime string.

The possible values for `allowSessions` are
* "all": allow all sessions
* "current": allow current sessions only (admins will still be allowed to log in)
* "admin": allow admin sessions only (other users will be logged out)

Status codes:
* 201 Created - if the operation succeeded
* 400 Bad request - if a system-wide alert already exists in the database
* 401 Unauthorized - if not logged in
* 403 Forbidden - if logged in as a non-admin user
* 422 Unprocessable Entity - if the request body cannot be parsed
