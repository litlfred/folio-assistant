---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s383-retrieve-own-processes
section_title: "Retrieve own processes"
file: "processes-endpoint.md"
lines: 372-383
source_sha256: 8be0eef3101645a6
granularity: heading
---
### Retrieve own processes
**GET /api/system/processes/search/own**

This return the list of owned processes, i.e. the processes that have been started by the current, logged-in, user

The supported parameters are:
* page, size [see pagination](README.md#Pagination)

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
