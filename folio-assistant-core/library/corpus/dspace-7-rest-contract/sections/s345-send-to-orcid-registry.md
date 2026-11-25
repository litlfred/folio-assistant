---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s345-send-to-orcid-registry
section_title: "Send to ORCID registry"
file: "orcidhistories.md"
lines: 42-61
source_sha256: d53f90e5dbc2260a
granularity: heading
---
## Send to ORCID registry
**POST /api/eperson/orcidhistories**

To send an ORCID queue entry to the ORCID api and create a record into the ORCID history a reference of an ORCID queue record must be posted to the ORCID history resource endpoint (/api/eperson/orcidhistories). The ORCID queue record must be supplied as URI in the request body using the text/uri-list content-type.

An optional query param named `forceAddition` with value true or false could be provided to force the send of a new resource to the ORCID api without an update of an existing resource even if for the provided ORCID queue record there is a putCode.

Return codes:
* 201 OK - if the operation succeed and the orcid history record is created
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions (only the owner of the profile is allowed)
* 404 Not found - if no ORCID queue entry exists related to the fiven URI
* 422 Unprocessable entity - if the ORCID object to synchronize with ORCID registry is not valid

An example curl call:
```
 curl -i -X POST https://demo.dspace.org/server/api/eperson/orcidhistories \
 -H "Content-Type:text/uri-list" \
 --data "https://demo.dspace.org/server/api/eperson/orcidqueues/10"
```
