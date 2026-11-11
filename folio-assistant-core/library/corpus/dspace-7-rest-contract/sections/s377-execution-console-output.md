---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s377-execution-console-output
section_title: "Execution Console Output"
file: "processes-endpoint.md"
lines: 147-158
source_sha256: 8be0eef3101645a6
granularity: heading
---
## Execution Console Output
**GET /api/system/processes/<:process-id>/output**

This endpoint will return the console output of the script. To keep the scope of this work limited, it will print the full console output without datestamps.
In a future version, a solution supporting a live-feed can also be included.

Status codes:
* 200 Ok - if the request succeed
* 401 Unauthorized - if you are not authenticated and the process was not started by an anonymous user
* 403 Forbidden - if you are not logged in as a repository administrator or the user that has started the process
* 404 Resource Not Found - if the specified process id doesn't exist
