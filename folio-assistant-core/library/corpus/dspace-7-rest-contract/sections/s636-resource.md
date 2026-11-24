---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s636-resource
section_title: "resource"
file: "subscriptions.md"
lines: 298-308
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
### resource
**GET api/core/subscriptions/<:id>/resource**

Return the DSpaceObject (Community, Collection, Item) linked by this subscription

Return codes:
* 200 Ok - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions.
* 404 Not found - if the subscription doesn't exist (or was already deleted)
