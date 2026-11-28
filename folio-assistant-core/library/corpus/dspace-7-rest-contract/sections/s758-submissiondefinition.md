---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s758-submissiondefinition
section_title: "submissionDefinition"
file: "workspaceitems.md"
lines: 156-165
source_sha256: 1bb50597a317b780
granularity: heading
---
#### submissionDefinition
**/api/submission/workspaceitems/<:id>/submissionDefinition** (READ-ONLY)

Example: to be provided

It returns the submission definition used by the inprogress submission. See the [submission definitions endpoint for more info](submissiondefinitions.md). This is a **read-only** endpoint. 
The submission definition used by the inprogress submission is derived from the inprogress submission attributes. In the default implementation the definition is derived from the collection where the submission is created and is updated if it changes. 
Please note that this endpoint is not strictly necessary as you can currently retrieve the same definition using [/api/config/submissiondefinitions/search/findByCollection?uuid=<:workspaceitem-collection-uuid>](submissiondefinitions.md#findByCollection) but it allows the client to find the submissionDefinition embedded in the workspaceitem without the need to make a separate call. 
In addition, it allows in future to change the 1:1 association between collections and submissionDefinition without breaking the client
