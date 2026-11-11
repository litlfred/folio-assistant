---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s222-related-dspace-object-of-group
section_title: "Related DSpace Object of group"
file: "epersongroups.md"
lines: 364-368
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
## Related DSpace Object of group
**GET /api/eperson/groups/<:uuid>/object** (READ-ONLY)

This returns the DSpace Object (Community, Collection) belonging to this Group.
This is only applicable for roles in that DSpace Object, e.g. the Community Administrator or Collection Submitter Group
