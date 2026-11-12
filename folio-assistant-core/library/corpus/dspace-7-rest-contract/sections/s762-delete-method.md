---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s762-delete-method
section_title: "DELETE Method"
file: "workspaceitems.md"
lines: 187-198
source_sha256: 1bb50597a317b780
granularity: heading
---
## DELETE Method

**/api/submission/workspaceitems/<:ws-item-uuid>**

Deletes workspace item with the given UUID. The deletion includes the deletion of the item object that is associated to the given workspace item.

Available Response Codes are

* 204 No content - if the operation succeed
* 401 Unauthorized - if the requester is not authenticated
* 403 Forbidden - if the requester does not have sufficient permissions ((deletion of workspace items can only be requested by the submitter of the workspace item or administrators)
* 404 Not found - if the workspace item doesn't exist
