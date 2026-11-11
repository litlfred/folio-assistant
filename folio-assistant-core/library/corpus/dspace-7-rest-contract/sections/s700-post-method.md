---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s700-post-method
section_title: "POST Method"
file: "workflowitems.md"
lines: 144-162
source_sha256: 568b9a61283641e9
granularity: heading
---
## POST Method
To create a WorkflowItem, i.e. to start a workflow, a WorkspaceItem must be posted to the `/workflowitems` resource
collection endpoint (`/api/workflow/workflowitems`).
The WorkspaceItem must be supplied as URI in the request body using the `text/uri-list` content-type.

An example curl call:
```
 curl -i -X POST http://localhost:8080/server/api/workflow/workflowitems \
 -H "Content-Type:text/uri-list" \
 --data "https://localhost:8080/server/api/submission/workspaceitems/1234"
```

It would respond with:
* 201 OK - If WorkflowItem was created successfully. The new state of the WorkflowItem is returned in the body.
If the body is empty, this means that no workflow was enabled & the Item is immediately available in the system.
* 401 Unauthorized - if you are not authenticated
* 403 Unauthorized - if the loggedin user is not the submitter of the WorkspaceItem
* 422 Unprocessable Entity - if the WorkspaceItem is not yet ready to be send through the workflow (i.e. there are validation errors)
