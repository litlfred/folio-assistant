---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s735-remove
section_title: "Remove"
file: "workspaceitem-data-sherpa-policy.md"
lines: 114-117
source_sha256: 4c7349310c02004a
granularity: heading
---
### Remove
To limit the load on the Sherpa webservices and improve performance sherpa data are cached. It is possible to force a fresh call removing the retrievalTime from the section as follow
`curl --data '[{ "op": "remove", "path": "/sections/sherpaPolicies/retrievalTime"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
