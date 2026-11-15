---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s709-remove-access-condition
section_title: "Remove Access Condition"
file: "workspaceitem-data-access.md"
lines: 66-74
source_sha256: b63435c1bff84133
granularity: heading
---
### Remove Access Condition
To remove a previous applied access condition it is sufficient to invoke a remove operation on the accessCondition position path, i.e.

`curl --data '{[ { "op": "remove", "path": "/sections/<:name-of-the-form>/accessConditions/<:access-idx>"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`

the following request will reset the access condition to the empty array

`curl --data '{[ { "op": "remove", "path": "/sections/<:name-of-the-form>/accessConditions"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
