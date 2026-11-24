---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s384-execution-deletion
section_title: "Execution Deletion"
file: "processes-endpoint.md"
lines: 384-396
source_sha256: 8be0eef3101645a6
granularity: heading
---
## Execution Deletion
**DELETE /api/system/processes/<:process-id>**

The will delete the process and associated files and output. Only processes with states of `SCHEDULED`, `COMPLETED` and `FAILED` can be deleted. 

Support for stopping a process can be included in a future version.

Status codes:
* 201 Created - if the operation succeed
* 404 Not found - if the processes doesn't exist
* 422 Unprocessable Entity - If the process is running
