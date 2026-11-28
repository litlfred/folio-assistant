---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s705-single-workflow-step-definition
section_title: "Single Workflow Step Definition"
file: "workflowsteps.md"
lines: 13-43
source_sha256: c18a1df355d0ae1b
granularity: heading
---
## Single Workflow Step Definition
**/api/config/workflowsteps/<:step-name>**

Provide detailed information about a specific workflow step. An example JSON response document:
```json
{
  	"id": "editstep",
  	"type": "workflowstep",
    "_links": {
      "workflowactions": {
        "href": "https://demo.dspace.org/server/api/config/workflowsteps/<:step-name>/workflowactions"
      }
    },
    "_embedded": {
      "workflowactions": 
        [
          {
            "id": "editaction",
            "options": [
                "approve",
                "reject",
                "edit_metadata"
            ],
            "type": "workflowaction"
          }
        ]
    }
}
```

It includes the list of workflow actions used in the workflow step. See [Workflow Actions Endpoints](workflowactions.md) for more details
