---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s147-delete-a-collection-workflow-group
section_title: "Delete a collection workflow group"
file: "collections.md"
lines: 653-662
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
##### Delete a collection workflow group
**DELETE /api/core/collections/<:uuid>/workflowGroups/<:workflow-role>**

Delete the Group associated with a Workflow role.

Error messages:
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 Unprocessable entity - if the role still has pending workflow tasks (deleting the group in that case may cause tasks to end up in an invalid state)
