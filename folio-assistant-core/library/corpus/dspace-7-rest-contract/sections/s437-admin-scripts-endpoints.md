---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s437-admin-scripts-endpoints
section_title: "Admin Scripts Endpoints"
file: "scripts-endpoint.md"
lines: 1-5
source_sha256: f015bdfaa9a025e1
granularity: heading
---
# Admin Scripts Endpoints
[Back to the list of all defined endpoints](endpoints.md)

DSpace has functionality to import and export items in CSV and ZIP format, to start a collection harvest run, to run or schedule curation tasks, …. Each of these functionalities also map on a DSpace CLI script. While we could implement each of these operations as a separate endpoint, this contract tries to describe a generic endpoint that allows administrators to explore, run or schedule DSpace CLI scripts from the REST API.
