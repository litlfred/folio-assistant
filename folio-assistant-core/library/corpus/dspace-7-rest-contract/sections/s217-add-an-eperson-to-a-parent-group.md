---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s217-add-an-eperson-to-a-parent-group
section_title: "Add an EPerson to a parent Group"
file: "epersongroups.md"
lines: 286-307
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Add an EPerson to a parent Group
**POST /api/eperson/groups/<:groupuuid>/epersons**

To add an eperson to a parent group, perform a POST to the Epeople of a Group endpoint when logged in as admin.

The actual eperson is part of the body using the uri-list

Example:
```bash
curl -i -X POST "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/epersons"
  -H "Content-Type:text/uri-list"
  -d "https://demo.dspace.org/server/api/eperson/epersons/a6086b34-3918-45b7-8ddd-9329a702a26a"
```

The eperson is mandatory

Return codes:
* 204: if the update succeeded 
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions 
* 422: if the specified eperson is not found
