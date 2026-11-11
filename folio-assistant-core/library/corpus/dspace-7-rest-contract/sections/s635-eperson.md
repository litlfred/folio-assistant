---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s635-eperson
section_title: "eperson"
file: "subscriptions.md"
lines: 287-297
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
### eperson
**GET api/core/subscriptions/<:id>/eperson**

Return the eperson linked by this subscription

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated.
* 403 Forbidden - if you are not logged in with sufficient permissions.
* 404 Not found - if the subscription doesn't exist (or was already deleted)
