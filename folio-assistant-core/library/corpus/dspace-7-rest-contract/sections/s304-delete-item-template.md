---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s304-delete-item-template
section_title: "Delete Item template"
file: "itemtemplates.md"
lines: 49-67
source_sha256: 3d264e2d3881f5a2
granularity: heading
---
#### Delete Item template
**DELETE /api/core/itemtemplates/<:uuid>**

A collection's item template can be deleted, automatically ensuring the relationship between the collection and the item template is removed as well.

Curl example:
```
curl 'https://demo.dspace.org/server/api/core/itemtemplates/34d343c5-feb7-4a54-b07f-20a92debe061' \
 -XDELETE \
 -H 'Authorization: Bearer eyJhbGciOiJI...'
```

* The item template is determined using the ID in the URL

Status codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the item template doesn't exist
