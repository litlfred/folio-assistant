---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s349-delete-an-orcid-queue-entry
section_title: "Delete an ORCID Queue entry"
file: "orcidqueues.md"
lines: 98-106
source_sha256: 6a6cb0b0b43ae012
granularity: heading
---
## Delete an ORCID Queue entry
**DELETE /api/eperson/orcidqueues/<:id>**

Delete a single ORCID queue entry by id. The provided response has no content.

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions  (only the owner of the profile is allowed)
