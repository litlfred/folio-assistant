---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s441-script-invocation
section_title: "Script Invocation"
file: "scripts-endpoint.md"
lines: 184-228
source_sha256: f015bdfaa9a025e1
granularity: heading
---
## Script Invocation
**POST /api/system/scripts/<:script-name>/processes**

POST requests to this endpoint will start the corresponding script with the provided parameters. All parameter values should be provided in the body that has to use the `multipart/form-data` content type. Once the upload is complete and the script was started successfully, this endpoint will return details on the scripts execution

Delayed scripts using a  `startTime` can be supported in a future version.

```json
{
  "processId" : "5",
  "userId" : "aa0263e2-b90a-4528-89fa-116ea4859de1",
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
      "href" : "/api/system/processes/5"
    },
    "script" : {
      "href" : "/api/system/scripts/import"
    },
    "output" : {
      "href" : "/api/system/processes/5/output"
    }
  }
}
```

The possible `status` values are `SCHEDULED`, `RUNNING`, `COMPLETED` and `FAILED`.

Status codes:
* 202 Accepted - if the task is accepted for processing
* 401 Unauthorized - if you are not authenticated and the script is not usable by anonymous users
* 403 Forbidden - if you are not logged in with sufficient permissions for the requested script according to the provided parameters
* 400 Not found - if the provided parameters don't match the script expectations
* 404 Not found - if the script doesn't exist
* 413 Payload too large - uploaded file is larger than limit set in configuration parameter `spring.servlet.multipart.max-file-size`
