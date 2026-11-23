---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s346-orcid-queue-endpoints
section_title: "ORCID Queue Endpoints"
file: "orcidqueues.md"
lines: 1-11
source_sha256: 6a6cb0b0b43ae012
granularity: heading
---
# ORCID Queue Endpoints
[Back to the list of all defined endpoints](endpoints.md)

These endpoints allow to handle the Orcid Queue records associated with a specific profile.
Only the EPerson who is the owner of the Profile Item can access them.

When these records are processed lead to the creation of Orcid History records
(see [orcid history contract](orcidhistories.md) for more details). 

These endpoints are only available when orcid.sychronization-enabled=true.
