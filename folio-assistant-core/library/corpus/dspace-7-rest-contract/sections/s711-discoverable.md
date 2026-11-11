---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s711-discoverable
section_title: "Discoverable"
file: "workspaceitem-data-access.md"
lines: 78-92
source_sha256: b63435c1bff84133
granularity: heading
---
#### Discoverable
To replace a previous discoverable flag value it is sufficient to invoke a replace operation on the discoverable position path, i.e.

`curl --data '{[ { "op": "replace", "path": "/sections/<:name-of-the-form>/discoverable", "value": true|false }]}' -X PATCH ${dspace7-url}/api/submission/workspaceitems/<:id>`

For example, starting with the following eperson field data:
```json
 "discoverable": true,
```
the replace operation `[{ "op": "replace", "path": "/sections/<:name-of-the-form>/discoverable", "value": false]` will result in :
```json
  "discoverable": false,
```
 For access configurations that do not allow the user to specify the visibility of the item, attempts to change the discoverable flag result in a response with 422 status from the server.
