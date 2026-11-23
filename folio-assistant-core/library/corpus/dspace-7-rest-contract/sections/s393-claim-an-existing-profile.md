---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s393-claim-an-existing-profile
section_title: "Claim an existing Profile"
file: "profiles.md"
lines: 188-209
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Claim an existing Profile
**POST /api/eperson/profiles?eperson=<:eperson-uuid>**

Modify the profile item specified in the request content to make the given eperson its owner. The content-type is uri-list with the url of the item's profile to be claimed.
This action can only be done by the EPerson themselves or an Administrator.

Parameters:
* eperson-uuid (optional): the uuid of eperson for which the profile is to be claimed; if not specified, the eperson is the authenticated one

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not Found - if the specified eperson does not exist
* 422 Unprocessable Entity - if the specified eperson has already a profile or if the profile to be claimed is already owned

An example curl call:
```bash
 curl -i -X POST ${dspace-url}/api/eperson/profiles?eperson=eb645ef8-1373-41eb-bf67-6afcea7e2069 -H "Content-Type:text/uri-list" \
 --data ${dspace-url}/api/core/items/cec6ee1b-7730-44da-a224-a7c5af63f821
```
