---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s747-move
section_title: "Move"
file: "workspaceitem-data-upload.md"
lines: 180-185
source_sha256: 28bff004b93bd7d6
granularity: heading
---
### Move
The move operation is allowed to the files index path to change the order of the uploaded file. 

The following request will move the 3rd uploaded file in the first position
`curl --data '{[ { "op": "add", "from":"/sections/<:name-of-the-form>/files/2", "path": "/sections/<:name-of-the-form>/files/0}]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`
