---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s420-single-resource-policy
section_title: "Single Resource Policy"
file: "resourcepolicies.md"
lines: 9-50
source_sha256: 36a99f15a2026313
granularity: heading
---
## Single Resource Policy
**/api/authz/resourcepolicies/<:id>**

Provide detailed information about a specific resource policy. The JSON response document is as follow

```json
{
  "id": 2844,
  "name": null,
  "description": null,
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : null,
  "endDate" : null,
  "type": "resourcepolicy"
}
```

Attributes
* name: a short name associated to describe the policy
* description: a description for the policy, i.e. the reason for the policy
* policyType: a classification of the policy meanly from the process that has set it. One of 
    * TYPE_SUBMISSION: a policy in place during the submission
    * TYPE_WORKFLOW: a policy in place during the approval workflow
    * TYPE_INHERITED: a policy that has been inherited from a container (the collection)
    * TYPE_CUSTOM: a policy defined by the user during the submission or workflow phase
    * null: if the information is not available
* action: the action grant by the policy. One of READ, WRITE, ADD, REMOVE, ADMIN, DELETE, WITHDRAWN_READ, DEFAULT_BITSTREAM_READ, DEFAULT_ITEM_READ as defined in the Constants class
* startDate: the first day of validity of the policy, if null the policy is assumed valid from ever. The date will be in the format YYYY-MM-DD
* endDate: the last day of validity of the policy, if null the policy is assumed valid for ever. The date will be in the format YYYY-MM-DD

Exposed links:
* eperson: link to the eperson that have permission grant by the policy
* group: link to the group that have permission grant by the policy
* resource: link to the resource subject to the policy

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated. Please note that this also apply to resource policy related to the Anonymous group
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators, users with ADMIN right on the target resource, users mentioned in the policy (eperson or member of the group) can access the resourcepolicy
* 404 Not found - if the resourcepolicy doesn't exist (or was already deleted)
