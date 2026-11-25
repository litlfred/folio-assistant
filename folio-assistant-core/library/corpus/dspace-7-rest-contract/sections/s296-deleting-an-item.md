---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s296-deleting-an-item
section_title: "Deleting an item"
file: "items.md"
lines: 567-584
source_sha256: b326bcd37dfbb1bf
granularity: heading
---
## Deleting an item

**DELETE /api/core/items/<:uuid>**

Delete an item.

An optional parameter for copying virtual metadata to actual metadata in the related items can be included (only authorized by admins): `copyVirtualMetadata`. This can contain values:
* all (all relationships are verified, and the virtual metadata in all related items is migrated to actual metadata)
* relationship type ID: only relationship types with the given ID(s) are migrated. The `copyVirtualMetadata` can be included multiple times to support multiple IDs
* configured: the behavior will be retrieved from a configuration parameter
* _not specified_: no virtual metadata is expanded to actual metadata

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the item doesn't exist (or was already deleted)
