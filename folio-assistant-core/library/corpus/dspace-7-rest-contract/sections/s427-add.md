---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s427-add
section_title: "Add"
file: "resourcepolicies.md"
lines: 136-212
source_sha256: 36a99f15a2026313
granularity: heading
---
### Add
The add operation allows to initialize or replace information with new one.

To set a startDate

```
curl --data '[ { "op": "add", "path": "/startDate", "value": "2019-10-31" }]' \
     -H 'Authorization: Bearer ...' \
     -H 'content-type: application/json' \
     -X PATCH \
     '${dspace7-url}/api/authz/resourcepolicies/${resourcepolicy-id}'
```

```json
  "id": 2844,
  "name": null,
  "description": null,
  "policyType": "TYPE_SUBMISSION",
  "action": "READ",
  "startDate" : null,
  "endDate" : null,
  "type": "resourcepolicy"
```

the add operation will result in:

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

To set a name and a description

```
curl --data '[ { "op": "add", "path": "/name", "value": "my name" }, { "op": "add", "path": "/description", "value": "my description"}]' \
     -H 'Authorization: Bearer ...' \
     -H 'content-type: application/json' \
     -X PATCH \
     '${dspace7-url}/api/authz/resourcepolicies/${resourcepolicy-id}'
```

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

the add operation will result in:

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

Return codes, see also general [return codes for PATCH requests](patch.md#error-codes):
* 200 Ok if the path operation succeed. The updated resource policy is included in the response
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators or user with ADMIN permission over the target resource can use the endpoint
* 404 Not found - if the resource policy doesn't exist (or was already deleted)
