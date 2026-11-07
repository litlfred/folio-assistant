---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s224-main-endpoint
section_title: "Main Endpoint"
file: "epersonregistrations.md"
lines: 4-8
source_sha256: 1c3d12225c2a3062
granularity: heading
---
## Main Endpoint
**GET /api/eperson/registrations**

As we don't have a use case to iterate over all the existent registrations, the main endpoint is not implemented and a 405 error code is returned according to our [general error response codes](README.md#Error-codes).
