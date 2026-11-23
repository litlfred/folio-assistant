---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s097-owner
section_title: "owner"
file: "claimedtasks.md"
lines: 35-39
source_sha256: bffc31e318cbb41a
granularity: heading
---
#### owner
**/api/workflow/claimedtasks/<:id>/owner** (READ-ONLY)

It returns the eperson that own the task. See the [eperson endpoint for more info](epersons.md). This is a **read-only** endpoint, once the task is claimed the owner cannot be changed. To unclaim a task see the DELETE method below
