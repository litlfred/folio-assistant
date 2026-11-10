---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s059-bundle
section_title: "Bundle"
file: "bitstreams.md"
lines: 73-97
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
### Bundle
**GET /api/core/bitstreams/<:uuid>/bundle**

Example: <https://demo.dspace.org/server/#https://demo.dspace.org/server/api/core/bitstreams/8d33bdfb-e7ba-43e6-a93a-f445b7e8a1e2/bundle>

It returns the bundle of the bitstream

**PUT /api/core/bitstreams/<:uuid>/bundle**

Move the bitstream to another bundle

Sample CURL command:
```
curl -i -X PUT 'https://demo.dspace.org/server/api/core/bitstreams/6ba01288-8a5a-4acf-96f1-fd0730424a1f/bundle' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/bundles/0b3c0ebf-83bc-4017-afa1-9df37a1a065c'
```

The uri-list should always contain exactly one bundle URI (URI of target bundle).

Error codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the bitstream doesn't exist
* 422 Unprocessable Entity - if the bundle doesn't exist, or if the amount of bundles is not 1
