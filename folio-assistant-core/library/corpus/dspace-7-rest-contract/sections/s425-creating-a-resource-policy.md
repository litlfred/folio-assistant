---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s425-creating-a-resource-policy
section_title: "Creating a resource policy"
file: "resourcepolicies.md"
lines: 100-133
source_sha256: 36a99f15a2026313
granularity: heading
---
## Creating a resource policy
**POST /api/authz/resourcepolicies?resource=<:uuid>&[eperson=<:uuid>|group=<:uuid>]**

Request body:
```json
{
  "name": null,
  "description": null,
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : null,
  "endDate" : null,
  "type": "resourcepolicy"
}
```

The parameters are:
* resource: mandatory, the uuid of the resource target of the policy
* eperson: the uuid of the eperson that will be grant of the permission. Exactly one of eperson or group is required
* group: the uuid of the group that will be grant of the permission. Exactly one of eperson or group is required

The json body must be valid that mean
- type must be resourcepolicy
- policyType must be one of the value specified in the GET description
- action must be one of the value specified in the GET description
- startDate / endDate if present must respect the format specified in the GET description

Return codes:
* 200 OK - if the operation succeed, the created resourcepolicy is returned
* 400 Bad Request - if both the group and the eperson uuid parameters are specified or missing or aren't uuid
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators can create resourcepolicy
