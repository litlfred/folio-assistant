---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s428-remove
section_title: "Remove"
file: "resourcepolicies.md"
lines: 213-263
source_sha256: 36a99f15a2026313
granularity: heading
---
### Remove
With the `remove` operation, you can delete:
- startDate
- endDate
- name
- description

the other properties cannot be nullified.

To remove an embargo you can for instance use the following

```
curl --data '[ { "op": "remove", "path": "/startDate" }]'
      -H 'Authorization: Bearer ...' \
      -H 'content-type: application/json' \
      -X PATCH \
      '${dspace7-url}/api/authz/resourcepolicies/${resourcepolicy-id}'
```

that will transform

```json
  "id": 2844,
  "name": "my name",
  "description": "my description",
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : "2019-10-31",
  "endDate" : null,
  "type": "resourcepolicy"
```

in 

```json
  "id": 2844,
  "name": "my name",
  "description": "my description",
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : null,
  "endDate" : null,
  "type": "resourcepolicy"
```

Return codes, see also general [return codes for PATCH requests](patch.md#error-codes):
* 200 Ok if the path operation succeed. The updated resource policy is included in the response
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or user with ADMIN permission over the target resource can use the endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
