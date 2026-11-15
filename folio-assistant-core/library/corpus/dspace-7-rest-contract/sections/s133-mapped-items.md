---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s133-mapped-items
section_title: "Mapped items"
file: "collections.md"
lines: 368-376
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### Mapped items
**/api/core/collections/<:uuid>/mappedItems**

This is a Read-only endpoint to retrieve the mapped items for this collection.

Item mappings can only be modified via [/items/[uuid]/mappedCollections](items.md#mapped-collections)

The request will return a list of items
