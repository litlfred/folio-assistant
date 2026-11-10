---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s593-starting-a-submission
section_title: "Starting a Submission"
file: "submission.md"
lines: 13-26
source_sha256: d5948e40a87939fd
granularity: heading
---
## Starting a Submission

In DSpace, a submission is started by creating a WorkspaceItem. The WorkspaceItem acts as an "in progress" submission object.

To create a WorkspaceItem, just `POST` to [/api/submission/workspaceitems](workspaceitems.md), passing in an owning Collection UUID (as every Item must belong to a Collection)
```
POST /api/submission/workspaceitems?owningCollection=<:collection-uuid>
```
This POST would create an empty WorkspaceItem by default.

Alternatively, you can create a WorkspaceItem by uploading a file via a Multipart POST,
or passing an [external entry value](external-authority-sources.md) whose metadata should be imported.
For more information, see "Multipart POST Method" in the [/api/submission/workspaceitems](workspaceitems.md) documentation.
