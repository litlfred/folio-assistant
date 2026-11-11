---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s394-hide-unhide-a-profile
section_title: "Hide/unhide a profile"
file: "profiles.md"
lines: 210-230
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Hide/unhide a profile
**PATCH /api/eperson/profiles/<:eperson-uuid>**

This operation allow to change the visibility of one profile. This action can only be done by the EPerson themselves or an Administrator.
A value of true means the Profile is given Anonymous READ access. A value of false, means the Profile is not accessible Anonymously.
Using the ResourcePolicies endpoint directly is possible to give more complex permissions.

To hide or unhide a profile use 
```bash
curl -i -X PATCH ${dspace-url}/api/eperson/profiles/eb645ef8-1373-41eb-bf67-6afcea7e2069 --data '[ { "op": "replace", "path": "/visible", "value": true }]' -H "Content-Type:application/json"
```

Status codes:

* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if a profile for the specified eperson does not exist

If the operation succeed the endpoint returns the updated resource.
