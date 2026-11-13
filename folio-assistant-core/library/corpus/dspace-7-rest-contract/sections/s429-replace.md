---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s429-replace
section_title: "Replace"
file: "resourcepolicies.md"
lines: 264-308
source_sha256: 36a99f15a2026313
granularity: heading
---
### Replace
The replace operation allows to replace *existent* information with new one. Attempt to use the replace operation to set not yet initialized information must return an error. See [general errors on PATCH requests](patch.md)

To change the startDate

```
curl --data '[ { "op": "replace", "path": "/startDate", "value": "2020-01-01" }]' \
     -H 'Authorization: Bearer ...' \
     -H 'content-type: application/json' \
     -X PATCH \
     '${dspace7-url}/api/authz/resourcepolicies/${resourcepolicy-id}'
```

For example, starting with the following item data:

```json
  "id": 2844,
  "name": null,
  "description": null,
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : "2019-10-31",
  "endDate" : null,
  "type": "resourcepolicy"
```

the replace operation will result in:

```json
  "id": 2844,
  "name": null,
  "description": null,
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : "2020-01-01",
  "endDate" : null,
  "type": "resourcepolicy"
```

Return codes, see also general [return codes for PATCH requests](patch.md#error-codes):
* 200 Ok if the path operation succeed. The updated resource policy is included in the response
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or user with ADMIN permission over the target resource can use the endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
