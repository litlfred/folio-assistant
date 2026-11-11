---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s363-group
section_title: "group"
file: "pooltasks.md"
lines: 41-45
source_sha256: 77e8609570924138
granularity: heading
---
#### group
**/api/workflow/pooltasks/<:id>/group** (READ-ONLY)

It returns the group of epersons that can claim the task. See the [group endpoint for more info](epersongroups.md). This is a **read-only** endpoint, once the task is created the backend group cannot be changed.
