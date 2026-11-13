---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s392-creating-a-new-profile
section_title: "Creating a new Profile"
file: "profiles.md"
lines: 167-187
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Creating a new Profile
**POST /api/eperson/profiles?eperson=<:eperson-uuid>**

Create a new profile for the specified person or for the current user. This action can only be done by the EPerson themselves or an Administrator.

Parameters:
* eperson-uuid (optional): the uuid of eperson for which the profile is to be created; if not specified, the eperson is the authenticated one

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 Unprocessable Entity - if the specified eperson does not exist or if for the specified eperson a profile already exists

In case of response with status 201 the endpoint returns the newly created resource, while in case of 422 it returns the resource that generated the conflict.

To create a new profile use 
```bash
curl -i -X POST ${dspace-url}/api/eperson/profiles?eperson=eb645ef8-1373-41eb-bf67-6afcea7e2069 -H "Content-Type:application/json"
```
