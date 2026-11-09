---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s362-eperson
section_title: "eperson"
file: "pooltasks.md"
lines: 36-40
source_sha256: 77e8609570924138
granularity: heading
---
#### eperson
**/api/workflow/pooltasks/<:id>/eperson** (READ-ONLY)

It returns the eperson that can claim the task. See the [eperson endpoint for more info](epersons.md). This is a **read-only** endpoint, once the task is created the backend eperson cannot be changed.
