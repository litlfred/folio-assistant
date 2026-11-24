---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s633-deleting-a-subscription-object
section_title: "Deleting a Subscription Object"
file: "subscriptions.md"
lines: 276-285
source_sha256: 3f07e3549dcc5de4
granularity: heading
---
## Deleting a Subscription Object
**DELETE /api/core/subscriptions/<:id>**

Deletes the subscription with the specified id.

* 204 No content - if the operation succeed.
* 401 Unauthorized - if you are not authenticated.
* 403 Forbidden - if you are not logged in with sufficient permissions. It must be owner of the subscription or an administrator.
* 404 Not found - if the subscription with id doesn't exist (or was already deleted).
