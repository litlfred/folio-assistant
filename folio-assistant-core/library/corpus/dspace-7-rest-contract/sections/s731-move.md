---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s731-move
section_title: "Move"
file: "workspaceitem-data-metadata.md"
lines: 492-497
source_sha256: 452bbe9cabe791be
granularity: heading
---
### Move
It is possible to rearrange place of the metadata values using the move operation. For instance to put the 3rd author in the first position run:

`curl --data '[{ "op": "move", "from": "/sections/traditionalpageone/dc.contributor.author/2", "path": "/sections/traditionalpageone/dc.contributor.author/0"}]' -X PATCH ${dspace7-url}/api/submission/workspaceitems/1`
