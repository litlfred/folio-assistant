---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s085-bitstreams
section_title: "Bitstreams"
file: "bundles.md"
lines: 156-218
source_sha256: 83759dccfb9965fd
granularity: heading
---
## Bitstreams

**GET /api/core/bundles/<:uuid>/bitstreams**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams>

It returns the bitstreams within this bundle. See the [bitstream endpoint](bitstreams.md#Single-Bitstream) for more info

The supported parameters are:
* page, size [see pagination](README.md#Pagination)

**POST /api/core/bundles/<:uuid>/bitstreams**

TODO: the item has to be known as well when creating a new bitstream. See https://jira.duraspace.org/browse/DS-4317?focusedCommentId=63099&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel#comment-63099

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams>

Curl example:
```
curl 'https://demo.dspace.org/server/api/core/bundles/d3599177-0408-403b-9f8d-d300edd79edb/bitstreams' \
 -XPOST -H 'Content-Type: multipart/form-data' \
 -H 'Authorization: Bearer eyJhbGciOiJI...' \
 -F "file=@Downloads/test.html" \
 -F 'properties={ "name": "test.html", "metadata": { "dc.description": [ { "value": "example file", "language": null, "authority": null, "confidence": -1, "place": 0 } ]}, "bundleName": "ORIGINAL" };type=application/json'
```

* The item is determined using the ID in the URL
* The file is uploaded using multipart/form-data
* The metadata of the bitstream is included as a json property, and with layout, it looks like:
```json
{
  "name": "test.html",
  "metadata": {
    "dc.description": [
      {
        "value": "example file",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }
    ]
  }
}
```
The bitstream properties can contain:
* The filename to be stored (optional)
* metadata for the bitstream (optional)

It returns the created bitstream. See the bitstream endpoint for more info](bitstreams.md#Single Bitstream)

The REST API can support Content-Length and Content-MD5 headers to verify integrity

Status codes:
* 201 Created - if the operation succeed
* 400 Bad Request - if there was no file
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bundle doesn't exist
* 412 Precondition Failed - if there is a discrepancy between the declared size or checksum and the computed one

This endpoint only accepts one file at a time. If multiple files are uploaded, any extra files will be ignored.
