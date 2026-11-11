---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s343-orcid-history-endpoints
section_title: "ORCID History Endpoints"
file: "orcidhistories.md"
lines: 1-11
source_sha256: d53f90e5dbc2260a
granularity: heading
---
# ORCID History Endpoints
[Back to the list of all defined endpoints](endpoints.md)

These endpoints allow you to manipulate the Orcid History records associated with a specific profile.
Only the EPerson who is the owner of the Profile Item can access them.

An Orcid History records is created starting from the processing of an Orcid Queue record,
an operation that involves an attempt to synchronize the entity with the ORCID registry.

These endpoints are only available when orcid.sychronization-enabled=true.
