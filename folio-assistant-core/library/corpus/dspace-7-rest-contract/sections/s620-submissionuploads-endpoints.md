---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s620-submissionuploads-endpoints
section_title: "SubmissionUploads Endpoints"
file: "submissionuploads.md"
lines: 1-5
source_sha256: b42751281c6064c3
granularity: heading
---
# SubmissionUploads Endpoints
[Back to the list of all defined endpoints](endpoints.md)

The proposed structure is derived from the configuration options already available in DSpace 6 and below. In the first implementation, a single configuration named *default* is expected as these configurations were set at the site level. Introducing an endpoint to manage a collection of configurations we open the door to future extension where different setups can be used for different kind of submissions (theses, technical reports, journal articles, etc.)
