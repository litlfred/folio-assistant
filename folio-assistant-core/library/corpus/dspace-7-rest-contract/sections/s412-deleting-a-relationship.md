---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s412-deleting-a-relationship
section_title: "Deleting a relationship"
file: "relationships.md"
lines: 377-399
source_sha256: 153081453688c8e9
granularity: heading
---
## Deleting a relationship

**DELETE /api/core/relationships/<:id>**

Delete a relationship between 2 items.

A sample CURL command would be:
```
curl -D - -XDELETE 'https://demo.dspace.org/server/api/core/relationships/890'  -H 'Authorization: Bearer eyJhbGciO…'
```

An optional parameter for copying virtual metadata to actual metadata in the related items can be included (only authorized if the user has permissions to update the metadata of the given items): `copyVirtualMetadata`. This can contain values:
* all: both items are verified, and the virtual metadata in both items is migrated to actual metadata
* left: only the left item will receive actual metadata
* right: only the right item will receive actual metadata
* configured: the behavior will be retrieved from a configuration parameter
* _not specified_: no virtual metadata is expanded to actual metadata

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the relationships doesn't exist (or was already deleted)
