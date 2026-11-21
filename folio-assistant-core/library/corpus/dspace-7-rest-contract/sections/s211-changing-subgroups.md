---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s211-changing-subgroups
section_title: "Changing subgroups"
file: "epersongroups.md"
lines: 151-155
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Changing subgroups
**PUT /api/eperson/groups/<:parent_group_uuid>/subgroups**

_Unsupported._ At this time, we do not support removing or replacing all subgroups in a single request. Please use `DELETE /api/core/groups/<:parent_group_uuid>/groups/<:sub_group_uuid>` to remove child groups one by one.
