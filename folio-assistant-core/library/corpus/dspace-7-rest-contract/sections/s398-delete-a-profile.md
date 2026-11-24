---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s398-delete-a-profile
section_title: "Delete a profile"
file: "profiles.md"
lines: 292-308
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Delete a profile
**DELETE /api/eperson/profiles/<:eperson-uuid>**

Delete the profile related to the given eperson. This action can only be done by the EPerson themselves or an Administrator.
The type of deletion depends on a configuration property. It can be a soft deletion, where only the link between the EPerson and Profile object is removed 
(so the Profile object remains). Or, it can be a hard deletion, where the Profile object is permanently deleted.


To delete a profile use
```bash
curl -i -X DELETE ${dspace-url}/api/eperson/profiles/eb645ef8-1373-41eb-bf67-6afcea7e2069
```

Return codes:
* 204: if the delete succeeded (including the case of no-op) 
* 401 Forbidden - if you are not authenticated
* 403 Unauthorized - if you are not logged in with sufficient permissions
