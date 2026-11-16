---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s218-remove-an-eperson-from-a-parent-group
section_title: "Remove an EPerson from a parent Group"
file: "epersongroups.md"
lines: 308-329
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Remove an EPerson from a parent Group
**DELETE /api/eperson/groups/<:groupuuid>/epersons/<:epersonuuid>**

To remove an eperson from a parent group, perform a DELETE to the Epeople of a Group endpoint when logged in as admin.

Example:
```bash
curl -i -X DELETE 
  "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/epersons/a6086b34-3918-45b7-8ddd-9329a702a26a"
```

The above request would remove the mapping between the group with UUID `617cf46b-535c-42d5-9d22-327ce2eff6dc`
 and the eperson with UUID `a6086b34-3918-45b7-8ddd-9329a702a26a`.


Return codes:
* 204: if the update succeeded (including the case of no-op if the eperson was not a member)
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions 
* 404 Not found - if the parent group doesn't exist
* 422 Unprocessable Entity - if the child group doesn't exist or if the specified eperson doesn't exist
