---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s379-get-process-file-types
section_title: "Get process file types"
file: "processes-endpoint.md"
lines: 314-342
source_sha256: 8be0eef3101645a6
granularity: heading
---
## Get process file types

**GET /api/system/processes/<:process-id>/filetypes**

Individual processes can have files of different "types". The types can be anything. It refers to what the file represents: e.g. mappingFile, exportCSV, etc.
This endpoint will return all the different file types for the given process.  The `/api/system/processes/<:process-id>/files/<:type>` endpoint can be used to find the file of that type.

```json
{
  "id": "filetypes",
  "values": [
    "inputFile",
    "outputFile"
  ],
  "type": "filetypes",
  "_links": {
    "self": {
        "href": "/api/system/processes/10/filetypes"
    }
  }
}
```

Status codes:
* 200 Ok - if the request succeed
* 401 Unauthorized - if you are not authenticated and the process was not started by an anonymous user
* 403 Forbidden - if you are not logged in as a repository administrator or the user that has started the process
* 404 Resource Not Found - if the specified process id doesn't exist
