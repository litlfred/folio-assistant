---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s376-execution-details
section_title: "Execution Details"
file: "processes-endpoint.md"
lines: 99-146
source_sha256: 8be0eef3101645a6
granularity: heading
---
## Execution Details
**GET /api/system/processes/<:process-id>**

This endpoint will return details on the requested process.

```json
{
  "processId" : "3",
  "userId" : "aa0263e2-b90a-4528-89fa-116ea4859de1",
  "startTime" : "2017-11-22T10:29:11Z",  
  "creationTime" : "2017-11-22T10:29:00Z",
  "endTime" : null,              
  "scriptName": "metadata-import",
  "processStatus" : "RUNNING",
  "parameters" : [
    {
    "name" : "-c",
    "value" : "954e5cfa-6990-4c85-ae42-f30d8c7888e2"
    },
    {
    "name" : "-n",
    "value" : "true"
    }
  ],
  "_links" : {
    "self" : {
      "href" : "/api/system/processes/3"
    },
    "script" : {
      "href" : "/api/system/scripts/import"
    },
    "output" : {
      "href" : "/api/system/processes/3/output"
    },
    "files" : {
      "href" : "/api/system/processes/3/files"
    }
  }
}
```

The possible `status` values are `SCHEDULED`, `RUNNING`, `COMPLETED` and `FAILED`.

Status codes:
* 200 Ok - if the request succeed
* 401 Unauthorized - if you are not authenticated and the process was not started by an anonymous user
* 403 Forbidden - if you are not logged in as a repository administrator or the user that has started the process
