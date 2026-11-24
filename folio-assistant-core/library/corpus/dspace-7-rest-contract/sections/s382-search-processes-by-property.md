---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s382-search-processes-by-property
section_title: "Search processes by Property"
file: "processes-endpoint.md"
lines: 355-371
source_sha256: 8be0eef3101645a6
granularity: heading
---
### Search processes by Property
**GET /api/system/processes/search/byProperty**

This supports a basic search of the processes

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* sort, options are startTime, endTime
* userId: optional, the uuid of the eperson who started the process. If not specified, all processes will be returned
* scriptName: optional, limit the returned processes to the specified script
* processStatus: optional, limit the returned processes to the specified status. The possible `status` values are `SCHEDULED`, `RUNNING`, `COMPLETED` and `FAILED`

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators can access the processes
