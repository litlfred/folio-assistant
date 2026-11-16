---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s090-update-primary-bitstream
section_title: "Update Primary bitstream"
file: "bundles.md"
lines: 321-340
source_sha256: 83759dccfb9965fd
granularity: heading
---
### Update Primary bitstream

If the Primary bitstream already exists, it can be changed using a PUT

**PUT /api/core/bundles/<:uuid>/primaryBitstream**

This should use `Content-Type:text/uri-list` with a single URI value which represents the new Bitstream to mark as primary.

```
curl -i -X PUT "https://demo7.dspace.org/api/core/bundles/[uuid]/primaryBitstream" -H "Content-type:text/uri-list" -d "https://demo7.dspace.org/api/core/bitstreams/[uuid]"
```

Status codes:
* 200 OK - if the operation succeeded
* 400 Bad Request - if there was no primary bitstream
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bundle doesn't exist
* 422 Unprocessable Entity - if the bitstream does not exist or is not part of this bundle
