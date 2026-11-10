---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s397-disconnect-a-profile-from-orcid
section_title: "Disconnect a profile from ORCID"
file: "profiles.md"
lines: 276-291
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Disconnect a profile from ORCID
**PATCH /api/eperson/profiles/<:eperson-uuid>**

This operation allow to disconnect an ORCID account from a given profile. Only an administrator can modify the profile of another eperson.
To do this, REMOVE operations must be used with one of the path **/orcid**

```bash
curl -X PATCH http://${dspace.server.url}/api/eperson/profiles/<:id-eperson> -H "* Content-Type: application/json" -d '[{ "op": "remove", "path": "/orcid" }]'
```
Status codes:

* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if a profile for the specified eperson does not exist
