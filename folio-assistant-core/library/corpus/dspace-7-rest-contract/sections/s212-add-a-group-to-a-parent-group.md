---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s212-add-a-group-to-a-parent-group
section_title: "Add a Group to a parent Group"
file: "epersongroups.md"
lines: 156-178
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Add a Group to a parent Group
**POST /api/eperson/groups/<:parentgroupuuid>/subgroups**

To add a child group to a parent group, perform a POST to the Sub groups of a Group endpoint when logged in as admin.

The actual sub group is part of the body using the uri-list

Example:
```bash
curl -i -X POST "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/subgroups"
  -H "Content-Type:text/uri-list"
  -d "https://demo.dspace.org/server/api/eperson/groups/05e3dbb8-332b-4487-a3f9-d78431b6cc02"
```

The group is mandatory

Return codes:
* 204: if the update succeeded 
* 401 Forbidden - if you are not authenticated
* 403 Unauthorized - if you are not logged in with sufficient permissions 
* 404 Not found - if the parent group doesn't exist
* 422 Unprocessable Entity - if the specified group is not found, or if adding the group would create a cyclic reference (ie. A -> B -> C, -> mean contains we cannot add A to C)
