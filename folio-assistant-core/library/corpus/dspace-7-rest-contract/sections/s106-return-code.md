---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s106-return-code
section_title: "Return code"
file: "claimedtasks.md"
lines: 122-127
source_sha256: bffc31e318cbb41a
granularity: heading
---
## Return code
* 204 No content is returned if the request succeed
* 403 Not authorized if the task cannot be performed by the logged in user
* 404 if the task is not longer available
* 422 validation errors (e.g. no "reason" parameter provided)
