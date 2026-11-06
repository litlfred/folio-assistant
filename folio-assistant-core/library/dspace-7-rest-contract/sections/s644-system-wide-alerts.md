---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s644-system-wide-alerts
section_title: "System-wide alerts"
file: "systemwidealerts.md"
lines: 1-11
source_sha256: 61bf56c22237aae7
granularity: heading
---
# System-wide alerts
[Back to the list of all defined endpoints](endpoints.md)

This endpoint exposes system-wide alerts to be shown as banners in the frontend.
Only administrators are allowed to create and edit these alerts, while all other users can view them.
Alerts are only shown to regular users when set to "active"; only administrators can see inactive alerts.

This feature will be expanded in the future
* DSpace currently only supports a single system-wide alert, but the endpoints are designed to accomodate multiple alerts
* Alerts can specify whether/how user sessions should be restricted while the alert is active, but this is a placeholder as session control has not been implemented yet.
