---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s645-retrieve-all-active-alerts
section_title: "Retrieve all active alerts"
file: "systemwidealerts.md"
lines: 12-20
source_sha256: 61bf56c22237aae7
granularity: heading
---
## Retrieve all active alerts
**GET /api/system/systemwidealerts/search/active**
Returns all currently active alerts; used to determine which alerts to show in the UI.
This is the only endpoint non-admin users ever need to interact with.

Status codes:
* 200 OK - if the operation succeeded
