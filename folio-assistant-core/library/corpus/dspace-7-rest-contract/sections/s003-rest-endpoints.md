---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s003-rest-endpoints
section_title: "REST Endpoints"
file: "README.md"
lines: 33-40
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## REST Endpoints
At the ROOT of the API a HAL document lists all the primary endpoints allowing full discovery of the API.
* [Endpoints](endpoints.md) - Documentation for all available endpoints
* [Submission / Deposit](submission.md) - How to deposit (or submit) a new Item into DSpace.
* [Search Options and Relationships (on Endpoints)](search-rels.md) - How to use `/search` sub-paths on many endpoints
* [Projections (on Endpoints)](projections.md) - How to use projections to return a subset or custom view of content
* [CSRF Protection (on Endpoints)](csrf-tokens.md) - When using modifying verbs (POST, PUT, PATCH, DELETE), you *must* pass a CSRF token in the request.
