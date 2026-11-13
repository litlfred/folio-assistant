---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s595-completing-the-submission-starting-workflow
section_title: "Completing the Submission / Starting Workflow"
file: "submission.md"
lines: 56-68
source_sha256: d5948e40a87939fd
granularity: heading
---
## Completing the Submission / Starting Workflow

In order to complete a submission, it MUST be sent into approval workflow. This is done by `POST`ing an existing
WorkspaceItem to the WorkflowItem endpoint.

See the "POST Method" of [/api/workflow/workflowitems](workflowitems.md) for examples.

In DSpace, approval workflow is configured per Collection, and is not enabled by default.
* If the Collection has no approval workflow configured (default), then the Item will become available immediately.
The final Item's UUID will be the same as it was in the WorkspaceItem (i.e. the `uuid` returned via
`/api/submission/workspaceitems/<:id>/item`)
* If the Collection has an approval workflow configured, then a WorkflowItem will be returned. Its `id` can be used
to access the WorkflowItem via `/api/workflow/workflowitems/<:id>`.
