---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s395-modify-orcid-synchronization-preferences
section_title: "Modify ORCID synchronization preferences"
file: "profiles.md"
lines: 231-255
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Modify ORCID synchronization preferences
**PATCH /api/eperson/profiles/<:eperson-uuid>**

This operation allow to change the ORCID synchronization mode and preferences of a given profile. Only an administrator can modify the profile of another eperson.
To do this, REPLACE operations must be used with one of the following paths:
* **/orcid/mode** - to update synchronization mode; allowed values are 'BATCH', 'MANUAL'
* **/orcid/publications** - to update the preference relative to the publications synchronization; allowed values are 'DISABLED', 'ALL'
* **/orcid/fundings** - to update the preference relative to the fundings synchronization; allowed values are 'DISABLED', 'ALL'
* **/orcid/profile** - to update the preference relative to the profile synchronization; allowed values are a 'BIOGRAPHICAL' (to synchronize other names, country and keywords) and 'IDENTIFIERS' (to synchronize external ids and urls). It is possible to specify multiple values using ',' as separator.


To modify the synchronization preferences use
```bash
curl -i -X PATCH ${dspace-url}/api/eperson/profiles/eb645ef8-1373-41eb-bf67-6afcea7e2069 --data '[ { "op": "replace", "path": "/orcid/mode", "value": "MANUAL" }]' -H "Content-Type:application/json"
```

Status codes:

* 200 OK - if the operation succeed
* 400 Bad Request - if the given profile is not already linked to an ORCID account
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if a profile for the specified eperson does not exist
* 422 Unprocessable entity - if the provided path or value is not valid
