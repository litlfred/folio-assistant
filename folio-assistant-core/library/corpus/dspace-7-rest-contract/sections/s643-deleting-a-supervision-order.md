---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s643-deleting-a-supervision-order
section_title: "Deleting a supervision order"
file: "supervisionorders.md"
lines: 82-97
source_sha256: 7ac02348ade76459
granularity: heading
---
## Deleting a supervision order

**DELETE /api/core/supervisionorders/<:id>**

Delete a supervision order.

A sample CURL command would be:
```
curl -D - -XDELETE 'https://demo.dspace.org/server/api/core/supervisionorders/42'  -H 'Authorization: Bearer eyJhafsdf…'
```

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions (Administrator)
* 404 Not found - if the supervision order doesn't exist
