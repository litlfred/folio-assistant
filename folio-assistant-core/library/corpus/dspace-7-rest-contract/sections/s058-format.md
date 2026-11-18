---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s058-format
section_title: "Format"
file: "bitstreams.md"
lines: 41-72
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Format
**GET /api/core/bitstreams/<:uuid>/format**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/bitstreams/8d33bdfb-e7ba-43e6-a93a-f445b7e8a1e2/format>

It returns the format of the bitstream

**PUT /api/core/bitstreams/<:uuid>/format**

Update the bitstream format of the bitstream

Sample CURL command:
```
curl -i -X PUT 'https://demo.dspace.org/server/api/core/bitstreams/6ba01288-8a5a-4acf-96f1-fd0730424a1f/format' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/bitstreamformats/6'
```

The uri-list should always contain exactly 1 bitstream format. This bitstream format will be assigned to the bitstream.

Error codes:
* 200 OK - if the operation succeeded
* 400 Bad Request - if the bitstream format doesn't exist, or if the amount of bitstream formats is not 1
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bitstream doesn't exist

Keep in mind that there's a change to dc.format in the API related to bitstream formats:
* setting the bitstream format to a known type removes dc.format in the bitstream metadata
* setting the bitstream format to unknown also removes dc.format in the bitstream metadata
* setting dc.format in the metadata will never implicitly change the bitstream format to unknown
* setting dc.format in the metadata will require a separate REST call, it's not part of the /format request
* setting dc.format will currently not be denied when the format is known, but it's not recommended to set it as such
