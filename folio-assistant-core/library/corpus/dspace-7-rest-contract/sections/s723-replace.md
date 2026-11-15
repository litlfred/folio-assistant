---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s723-replace
section_title: "Replace"
file: "workspaceitem-data-license.md"
lines: 91-97
source_sha256: aadd1539f4aba55d
granularity: heading
---
### Replace
To accept or reject a license the client can also send a JSON Patch REPLACE operation to the *granted* path as follow

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/granted", "value": true}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

`curl --data '{[ { "op": "add", "path": "/sections/<:name-of-the-form>/granted", "value": false}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`
