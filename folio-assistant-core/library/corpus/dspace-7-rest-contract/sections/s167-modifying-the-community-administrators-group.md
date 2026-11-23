---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s167-modifying-the-community-administrators-group
section_title: "Modifying the Community administrators group"
file: "communities.md"
lines: 259-266
source_sha256: 91351bf44765781b
granularity: heading
---
##### Modifying the Community administrators group

All modifications to the group will be performed directly on the Group endpoint:
* Adding members will need to use the [EPerson Group endpoint](epersongroups.md#add-an-eperson-to-a-parent-group)
* Adding sub-groups will need to use the [EPerson Group endpoint](epersongroups.md#add-a-group-to-a-parent-group)

Modifying the Community administrators group will be authorized for admins and (parent) community admins
