---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s161-delete-logo
section_title: "Delete Logo"
file: "communities.md"
lines: 175-195
source_sha256: 91351bf44765781b
granularity: heading
---
#### Delete Logo
**DELETE /api/core/communities/<:uuid>/logo**

To be used on a community with a logo

Curl example:
```
curl 'https://demo.dspace.org/server/api/core/communities/1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb/logo' \
 -XDELETE \
 -H 'Authorization: Bearer eyJhbGciOiJI...'
```

* The community is determined using the ID in the URL

Status codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the community doesn't exist
* 422: if the community didn't contain a logo
