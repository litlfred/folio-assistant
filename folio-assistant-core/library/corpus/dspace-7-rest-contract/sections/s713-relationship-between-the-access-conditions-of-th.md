---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s713-relationship-between-the-access-conditions-of-th
section_title: "Relationship between the access conditions of the item and the bitstreams"
file: "workspaceitem-data-access.md"
lines: 110-111
source_sha256: b63435c1bff84133
granularity: heading
---
## Relationship between the access conditions of the item and the bitstreams
Access conditions set on an item can be overwritten by specific access conditions set directly on the bitstreams via [workspaceitem data upload](workspaceitem-data-upload.md). If a bistream has no specific access conditions then it inherits those of the item; if an access conditions is inplace for the bitstream, then those of the item are ignored and are not applied to it.
