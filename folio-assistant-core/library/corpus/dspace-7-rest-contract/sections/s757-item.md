---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s757-item
section_title: "item"
file: "workspaceitems.md"
lines: 149-155
source_sha256: 1bb50597a317b780
granularity: heading
---
#### item
**/api/submission/workspaceitems/<:id>/item** (READ-ONLY)

Example: to be provided

It returns the backend item holds by the submission. See the [item endpoint for more info](items.md). This is a **read-only** endpoint, once the inprogress submission is created the backend item cannot be changed. Update to the backend item will be reflected automatically on the inprogress submission but are not subject to the submission validation, i.e. they correspond to administrative edits
