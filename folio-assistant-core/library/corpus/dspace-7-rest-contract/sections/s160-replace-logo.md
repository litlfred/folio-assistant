---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s160-replace-logo
section_title: "Replace Logo"
file: "communities.md"
lines: 145-174
source_sha256: 91351bf44765781b
granularity: heading
---
#### Replace Logo
**PUT /api/core/communities/<:uuid>/logo**

To be used on a community with a logo

Curl example:
```
curl 'https://demo.dspace.org/server/api/core/communities/1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb/logo' \
 -XPUT -H 'Content-Type: multipart/form-data' \
 -H 'Authorization: Bearer eyJhbGciOiJI...' \
 -F "file=@Downloads/test.png"
```

* The community is determined using the ID in the URL
* The file is uploaded using multipart/form-data

It returns the created bitstream. [See the bitstream endpoint for more info](bitstreams.md#Single Bitstream)

The REST API can support Content-Length and Content-MD5 headers to verify integrity

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the community doesn't exist
* 412 Precondition Failed - if there is a discrepancy between the declared size or checksum and the computed one
* 422 Unprocessable Entity - if there was no file, or if the community didn't contain a logo

This endpoint only accepts one file at a time. If multiple files are uploaded, any extra files will be ignored.
