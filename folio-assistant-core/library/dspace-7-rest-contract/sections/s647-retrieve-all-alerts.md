---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s647-retrieve-all-alerts
section_title: "Retrieve all alerts"
file: "systemwidealerts.md"
lines: 49-59
source_sha256: 61bf56c22237aae7
granularity: heading
---
## Retrieve all alerts
**GET /api/system/systemwidealerts**
This endpoint returns a list of all system-wide alerts.
Inactive alerts are included

Status codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if not logged in
* 403 Forbidden - if logged in as a non-admin user
