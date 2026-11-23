---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s741-remove
section_title: "Remove"
file: "workspaceitem-data-upload.md"
lines: 153-156
source_sha256: 28bff004b93bd7d6
granularity: heading
---
### Remove
It is possible to remove an uploaded file specifying its index in the path of a remove operation 
`curl --data '{[ { "op": "remove", "path": "/sections/uploads/files/<:idx-file>"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
