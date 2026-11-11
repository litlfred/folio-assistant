---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s743-access-condition
section_title: "Access Condition"
file: "workspaceitem-data-upload.md"
lines: 160-166
source_sha256: 28bff004b93bd7d6
granularity: heading
---
#### Access Condition
To remove a previous applied access condition it is sufficient to invoke a remove operation on the accessCondition position path, i.e.
`curl --data '{[ { "op": "remove", "path": "/sections/uploads/files/<:idx-file>/accessConditions/<:access-idx>"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

the following request will reset the access condition of the specified file to the empty array
`curl --data '{[ { "op": "remove", "path": "/sections/uploads/files/<:idx-file>/accessConditions"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
