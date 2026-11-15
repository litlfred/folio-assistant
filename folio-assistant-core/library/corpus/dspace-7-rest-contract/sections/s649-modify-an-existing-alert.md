---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s649-modify-an-existing-alert
section_title: "Modify an existing alert"
file: "systemwidealerts.md"
lines: 89-115
source_sha256: 61bf56c22237aae7
granularity: heading
---
## Modify an existing alert
**PUT /api/system/systemwidealerts/<:alert-id>**
This endpoint allows administrators to edit an existing system-wide alert.

Example request:
```json
{
  "message": "Another message",
  "allowSessions": "all",
  "countdownTo": "2024-05-06T00:00:00.000Z",
  "active": true
}
```

The value of `countdownTo` must be a UTC datetime string.

The possible values for `allowSessions` are
* "all": allow all sessions
* "current": allow current sessions only (admins will still be allowed to log in)
* "admin": allow admin sessions only (other users will be logged out)

Status codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if not logged in
* 403 Forbidden - if logged in as a non-admin user
* 404 Not found - if no alert exists for the requested identifier
* 422 Unprocessable entity - if the request body cannot be parsed
