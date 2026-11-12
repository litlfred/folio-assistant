---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s756-collection
section_title: "collection"
file: "workspaceitems.md"
lines: 142-148
source_sha256: 1bb50597a317b780
granularity: heading
---
#### collection
**/api/submission/workspaceitems/<:id>/collection** (READ-ONLY)

Example: to be provided

It returns the collection where the inprogress submission is occuring. This is a **read-only** endpoint, once the inprogress submission is created the collection cannot be changed directly. Specific section, like the enhanced select-collection section planned for DSpace7 will be able to alter the collection manipulating the *sections* data.
