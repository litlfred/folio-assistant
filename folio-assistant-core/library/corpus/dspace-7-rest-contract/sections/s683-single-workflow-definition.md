---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s683-single-workflow-definition
section_title: "Single Workflow Definition"
file: "workflowdefinitions.md"
lines: 14-29
source_sha256: aa48f93b9c287b17
granularity: heading
---
## Single Workflow Definition
**/api/config/workflowdefinitions/<:definition-name>**

Provide detailed information about a specific workflow definition. The JSON response document is as follows:
```json
{
  "name": "default",
  "isDefault": true,
  "type": "workflow-definition"
}
```

Exposed links:
* collections: list of collections that explicitly use such workflow-definition
* steps: list of workflow steps included in this definition
