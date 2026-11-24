---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s146-collection-workflow-groups
section_title: "Collection Workflow groups"
file: "collections.md"
lines: 637-652
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
#### Collection Workflow groups
**/api/core/collections/<:uuid>/workflowGroups/<:workflow-role>**

Endpoints for managing the Collection Workflow groups

This works similar to the [Collection administrators](#collection-administrators).  
The differences are:
* The collection administrators can also create the Collection Workflow groups
* The <:workflow-role> can be any role configured in the workflow with scope Collection. A HAL link for each of these groups will be included

The workflow role can be e.g.:
* reviewer
* editor
* finaleditor
* reviewmanagers
