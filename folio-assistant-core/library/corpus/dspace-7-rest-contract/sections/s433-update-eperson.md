---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s433-update-eperson
section_title: "Update eperson"
file: "resourcepolicies.md"
lines: 332-354
source_sha256: 36a99f15a2026313
granularity: heading
---
#### Update eperson
**PUT /api/authz/resourcepolicies/<:id>/eperson**

Update the eperson linked by this resource policy 

Sample CURL command:

```
curl -X PUT '${dspace7-url}/api/authz/resourcepolicies/3/eperson' \
     -H 'Authorization: Bearer eyJhbGciOiJ…' \
     -H 'Content-Type:text/uri-list' \
     --data '${dspace7-url}/api/eperson/epersons/ba05e3dd-aa20-4441-ac05-8ceef6f67ac7'
```

The uri-list should always contain exactly 1 eperson. This eperson will be assigned to the resource policy

Return codes:
* 204 No content - if the operation succeed
* 401 Unauthorized - if you are not authenticated and the policy is not related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. See the requirement in the GET Single Resource Policy endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
* 422 Unprocessable Entity - if the resourcepolicy is not related to an eperson or for empty uri-list or uri-list contains many strings or uri-list contains group instead of eperson
