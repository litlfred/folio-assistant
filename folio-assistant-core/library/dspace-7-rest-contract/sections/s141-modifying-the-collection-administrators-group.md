---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s141-modifying-the-collection-administrators-group
section_title: "Modifying the collection administrators group"
file: "collections.md"
lines: 593-600
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
##### Modifying the collection administrators group

All modifications to the group will be performed directly on the Group endpoint:
* Adding members will need to use the [EPerson Group endpoint](epersongroups.md#add-an-eperson-to-a-parent-group)
* Adding sub-groups will need to use the [EPerson Group endpoint](epersongroups.md#add-a-group-to-a-parent-group)

Modifying the collection administrators group will be authorized for admins, parent community admins and collection admins
