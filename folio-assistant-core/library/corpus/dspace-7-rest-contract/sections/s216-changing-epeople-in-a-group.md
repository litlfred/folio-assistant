---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s216-changing-epeople-in-a-group
section_title: "Changing Epeople in a Group"
file: "epersongroups.md"
lines: 281-285
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Changing Epeople in a Group
**PUT /api/eperson/groups/<:groupuuid>/epersons**

_Unsupported._ At this time, we do not support removing or replacing all epersons in a single request. Please use `DELETE /api/eperson/groups/<:groupuuid>/epersons/<:epersonuuid>` to remove the epersons one by one.
