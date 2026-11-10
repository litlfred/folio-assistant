---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s060-content
section_title: "Content"
file: "bitstreams.md"
lines: 98-118
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Content
**/api/core/bitstreams/<:uuid>/content**

Example: <https://demo.dspace.org/server/api/core/bitstreams/8d33bdfb-e7ba-43e6-a93a-f445b7e8a1e2/content>

It returns the actual content (bits) described by the bitstream

Supported Request Parameter:
* **authentication-token**: optional parameter that allows downloads for restricted files, a token needs to be requested from the [following endpoint](authentication.md#Request-short-lived-token) 

Response Headers:

* **ETag**: contains the md5 checksum as recorded in the bitstream record
* **Content-Type**: the mimetype as recorded in the bitstream format registry 
* **Content-Length**: the size in bytes of the content as recorded in the bitstream record

The supported **Request Headers** are:
* If-Modified-Since: not implemented yet. Support for cache control
* Range: not implemented yet. Provide support to partial content download
* If-None-Match: not implemented yet. Support for cache control
