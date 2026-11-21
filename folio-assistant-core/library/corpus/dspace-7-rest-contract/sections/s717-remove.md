---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s717-remove
section_title: "Remove"
file: "workspaceitem-data-cclicense.md"
lines: 68-70
source_sha256: 90c32c8eeac8db58
granularity: heading
---
### Remove
It is possible to remove a previously granted CC license 
`curl --data '{[ { "op": "remove", "path": "/sections/<:name-of-the-form>/uri"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
