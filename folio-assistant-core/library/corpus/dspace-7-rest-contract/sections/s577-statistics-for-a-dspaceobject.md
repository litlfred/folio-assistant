---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s577-statistics-for-a-dspaceobject
section_title: "Statistics for a DSpaceObject"
file: "statistics-reports.md"
lines: 4-8
source_sha256: 6350722f8b4de96d
granularity: heading
---
## Statistics for a DSpaceObject
**GET /api/statistics/usagereports**

As we don't have a use case to iterate over all the existing usage reports, the main endpoint is not implemented and a 405 error code is returned according to our [general error response codes](README.md#Error-codes).
