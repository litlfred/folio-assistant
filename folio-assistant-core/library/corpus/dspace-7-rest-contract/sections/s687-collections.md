---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s687-collections
section_title: "collections"
file: "workflowdefinitions.md"
lines: 37-42
source_sha256: aa48f93b9c287b17
granularity: heading
---
#### collections
**/api/config/workflowdefinitions/<:definition-name>/collections**

It returns the list of collections that make an explicit use of the workflow-definition.  
If a collection doesn't specify the workflow-definition to be used, the default mapping applies, but this collection is not included in the list returned by this method.
