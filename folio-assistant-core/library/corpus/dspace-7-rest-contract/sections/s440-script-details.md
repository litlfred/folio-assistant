---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s440-script-details
section_title: "Script Details"
file: "scripts-endpoint.md"
lines: 50-183
source_sha256: f015bdfaa9a025e1
granularity: heading
---
### Script Details
**GET /api/system/scripts/<:script-name>**

This endpoint will return information on all the parameters that are required to invoke the script. This depends on the parameters defined in the implementation of the script.

The JSON response document is as follows
```json
{
   "id" : "import",
   "name" : "import",
   "description" : "Import items into DSpace",
   "type" : "script",
   "parameters" : [
    {
      "name" : "-a",
      "nameLong" : "--add",
      "description" : "add items to DSpace",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-b", 
      "nameLong" : "--add-bte",
      "description" : "add items to DSpace via Biblio-Transformation-Engine (BTE)",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-c",      
      "nameLong" : "--collection",
      "description" : "destination collection(s) database ID",
      "type" : "id",
      "mandatory" : false
    },
    {
      "name" : "-d", 
      "nameLong" : "--delete",
      "description" : "delete items listed in mapfile",
      "type" : "file",
      "mandatory" : false
    },
    {
      "name" : "-e",
      "nameLong" : "--eperson",
      "description" : "email of eperson doing importing",
      "type" : "string",
      "mandatory" : false
    },
    {
      "name" : "-i",
      "nameLong" : "--inputtype",
      "description" : "input type in case of BTE import",
      "type" : "string",
      "mandatory" : false
    },
    {
      "name" : "-n",
      "nameLong" : "--notify",
      "description" : "if sending submissions through the workflow, send notification emails",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-p",
      "nameLong" : "--template",
      "description" : "apply template",
      "type" : "string",
      "mandatory" : false
    },
    {
      "name" : "-q",
      "nameLong" : "--quiet",
      "description" : "don't display metadata",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-m",    
      "nameLong" : "--mapfile",
      "description" : "mapfile items in mapfile",
      "type" : "file",
      "mandatory" : true
    },
    {
      "name" : "-r",   
      "nameLong" : "--replace",
      "description" : "replace items in mapfile",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-R",    
      "nameLong" : "--resume",
      "description" : "resume a failed import (add only)",
      "type" : "boolean"
    },
    {
      "name" : "-t",
      "nameLong" : "--test",
      "description" : "test run - do not actually import items",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-w",      
      "nameLong" : "--workflow",
      "description" : "send submission through collection's workflow",
      "type" : "boolean",
      "mandatory" : false
    },
    {
      "name" : "-z",
      "nameLong" : "--zip",
      "description" : "zip file containing the import",
      "type" : "file",
      "mandatory" : false
    }
   ]
}
```

Following parameter types are available:
* `string`: A regular string value
* `date`: A string that has a valid date pattern
* `boolean`: true or false
* `file`: For parameters with this type, the user has to provide a file. This would be a multipart POST request using the same filename
* `output`: Parameters with this type define the name of the output file. This name can be used later to download the the output file (e.g. when running `export` or `metadata-export`).

Status codes:
* 200 Ok - if the script exists and can be accessed by the loggedin User
* 401 Unauthorized - if you are not authenticated and the script is not usable by anonymous users
* 403 Forbidden - if you are not logged in with sufficient permissions for the requested script
* 404 Resource Not Found - if a script with the specified name doesn't exist
