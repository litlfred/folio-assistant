---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s213-remove-a-group-from-a-parent-group
section_title: "Remove a Group from a parent Group"
file: "epersongroups.md"
lines: 179-199
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Remove a Group from a parent Group
**DELETE /api/eperson/groups/<:parent_group_uuid>/subgroups/<:sub_group_uuid>**

A DELETE request will result in removing a subgroup from the parent group

Example:
```bash
curl -i -X DELETE 
  "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/subgroups/05e3dbb8-332b-4487-a3f9-d78431b6cc02"
```

The above request would remove the mapping between the parent group with UUID `617cf46b-535c-42d5-9d22-327ce2eff6dc`
 and the child group with UUID `05e3dbb8-332b-4487-a3f9-d78431b6cc02`.

Return codes:
* 204: if the delete succeeded (including the case of no-op if the child group was not a subgroup) 
* 401 Forbidden - if you are not authenticated
* 403 Unauthorized - if you are not logged in with sufficient permissions
* 404 Not found - if the parent group doesn't exist
* 422 Unprocessable Entity - if the child group doesn't exist
