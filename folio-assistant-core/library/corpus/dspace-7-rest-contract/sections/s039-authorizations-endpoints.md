---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s039-authorizations-endpoints
section_title: "Authorizations Endpoints"
file: "authorizations.md"
lines: 1-7
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
# Authorizations Endpoints
[Back to the list of all defined endpoints](endpoints.md)

An authorization is the representation of some rights that are available to a specific user (eperson) on a defined object, eventually the whole repository (site object).
All the authorizations are always explicitly listed regardless to how they are grant, by direct policies via groups' membership or open to everyone (anonymous users).
Please note that these endpoints are all READ-ONLY, authorizations are granted and withdrawn as result of business processes, configurations and resource policies.
