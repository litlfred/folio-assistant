---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s380-execution-file-output-using-type-identifier
section_title: "Execution File Output (using type identifier)"
file: "processes-endpoint.md"
lines: 343-353
source_sha256: 8be0eef3101645a6
granularity: heading
---
## Execution File Output (using type identifier)
**GET /api/system/processes/<:process-id>/files/<:type>**

Returns a single file of the specified process with the provided type (the type matches on the dspace.process.filetype metadata field of the bitstream)

Status codes:
* 200 Ok - if the request succeed
* 401 Unauthorized - if you are not authenticated and the process was not started by an anonymous user
* 403 Forbidden - if you are not logged in as a repository administrator or the user that has started the process
* 404 Resource Not Found - if the specified process id or file type doesn't exist
