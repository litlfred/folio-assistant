---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s435-update-group
section_title: "Update group"
file: "resourcepolicies.md"
lines: 367-389
source_sha256: 36a99f15a2026313
granularity: heading
---
#### Update group
**PUT /api/authz/resourcepolicies/<:id>/group**

Update the group linked by this resource policy 

Sample CURL command:

```
curl -X PUT '${dspace7-url}/api/authz/resourcepolicies/4/group' \
     -H 'Authorization: Bearer eyJhbGciOiJ…' \
     -H 'Content-Type:text/uri-list' \
     --data '${dspace7-url}/api/eperson/groups/db337ae5-abd2-4a28-b4ad-918cf7779e25'
```

The uri-list should always contain exactly 1 group. This group will be assigned to the resource policy

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated and the policy is not related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Resource Policy endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
* 422 Unprocessable Entity - if the resourcepolicy is not related to group or for empty uri-list or uri-list contains many strings or uri-list contains eperson instead of group
