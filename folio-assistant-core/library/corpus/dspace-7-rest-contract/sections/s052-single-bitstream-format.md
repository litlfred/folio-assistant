---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s052-single-bitstream-format
section_title: "Single Bitstream Format"
file: "bitstreamformats.md"
lines: 36-98
source_sha256: f518a87d58ac0a85
granularity: heading
---
## Single Bitstream Format
**GET /api/core/bitstreamformats/<:id>**

Provide detailed information about a specific bitstream format. The JSON response document is as follow
```json
{
  "id": 5,
  "shortDescription": "XML",
  "description": "Extensible Markup Language",
  "mimetype": "text/xml",
  "supportLevel": "KNOWN",
  "internal": false,
  "extensions": [
    "xml"
  ],
  "type": "bitstreamformat",
  "_links": {
    "self": {
      "href": "https://dspace7-internal.atmire.com/rest/api/core/bitstreamformats/5"
    }
  }
}
```

Exposed links:
* self

**PUT /api/core/bitstreamformats/<:id>**

Updates a specific bitstream format. Requires an admin account. The JSON should be similar to:
```json
{
  "id": 6,
  "shortDescription": "Text",
  "description": "Plain Text",
  "mimetype": "text/plain",
  "supportLevel": "KNOWN",
  "internal": false,
  "extensions": [
    "txt",
    "asc"
  ],
  "type": "bitstreamformat"
}

```

Status codes:
* 200 Created - if the operation succeed
* 400 Bad request - if the supportLevel is invalid. The valid values are https://github.com/DSpace/DSpace/blob/master/dspace-api/src/main/java/org/dspace/content/BitstreamFormat.java#L94
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bitstream format doesn't exist

**DELETE /api/core/bitstreamformats/<:id>**

Deletes a specific bitstream format. Requires an admin account. No JSON details are required.

Status codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bitstream format doesn't exist (or was already deleted)
