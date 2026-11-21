---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s051-main-endpoint
section_title: "Main Endpoint"
file: "bitstreamformats.md"
lines: 4-35
source_sha256: f518a87d58ac0a85
granularity: heading
---
## Main Endpoint
**GET /api/core/bitstreamformats**   

Provide access to the bitstream formats defined in the registry (DBMS based). It returns the list of existent metadata fields.

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/bitstreamformats>

**POST /api/core/bitstreamformats**   

Create a new bitstream format in the registry (DBMS based). Requires an admin account

The JSON should be similar to:
```json
{
  "shortDescription": "XML",
  "description": "Extensible Markup Language",
  "mimetype": "text/xml",
  "supportLevel": "KNOWN",
  "internal": false,
  "extensions": [
          "xml"
  ],
  "type": "bitstreamformat"
}
```

Status codes:
* 201 Created - if the operation succeed
* 400 Bad request - if the supportLevel is invalid. The valid values are https://github.com/DSpace/DSpace/blob/master/dspace-api/src/main/java/org/dspace/content/BitstreamFormat.java#L94
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
