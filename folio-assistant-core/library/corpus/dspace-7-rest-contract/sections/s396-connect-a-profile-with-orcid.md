---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s396-connect-a-profile-with-orcid
section_title: "Connect a profile with ORCID"
file: "profiles.md"
lines: 256-275
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Connect a profile with ORCID
**PATCH /api/eperson/profiles/<:eperson-uuid>**

This operation allow to connect an ORCID account with a given profile. Only an administrator can modify the profile of another eperson.
To do this, ADD operations must be used with one of the following path:
* **/orcid** - the allowed value is the authorization code for an ORCID iD and 3-legged access token.

```bash
curl -X PATCH http://${dspace.server.url}/api/eperson/profiles/<:id-eperson> -H "* Content-Type: application/json" -d '[{ "op": "add", "path": "/orcid", value: <code> }]'
```

Status codes:

* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if a profile for the specified eperson does not exist
* 422 Unprocessable entity - if the given code is not valid
* 500 Internal server error - if there are integration configuration errors or if the orcid service is down
