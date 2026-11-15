---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s746-access-condition
section_title: "Access Condition"
file: "workspaceitem-data-upload.md"
lines: 173-179
source_sha256: 28bff004b93bd7d6
granularity: heading
---
#### Access Condition
You can replace an existent access condition with a new one using the replace operation. The new settings must be valid for the selected access condition (name) according to the [submissionupload configuration endpoint](submissionuploads.md).

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/files/<:file-idx>/accessConditions/0", "value": {name: "embargo", startDate: "2018-12-31"}}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

please note that the above works only because of openaccess and administrator have the same settings needs (no need of addition information). Indeed, the backend is expected to remove the existent policy and create a new policy. If the settings of the previous and new access condition differs the request must fail with a 422 error code
