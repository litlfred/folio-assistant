---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s245-groups
section_title: "Groups"
file: "epersons.md"
lines: 283-290
source_sha256: f15d99d416d78ed5
granularity: heading
---
### Groups
**GET /api/eperson/epersons/<:uuid>/groups**

A HAL link to retrieve the eperson groups of an eperson is included.
This will return a pageable list of the groups this person is a direct member of

> TODO: A solution to retrieve direct and indirect groups of an eperson is also required.
> This would use GroupService.allMemberGroupsSet() and is used e.g. when viewing an EPerson as an admin
