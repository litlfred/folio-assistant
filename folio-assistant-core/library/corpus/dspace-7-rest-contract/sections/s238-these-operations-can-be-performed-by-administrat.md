---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s238-these-operations-can-be-performed-by-administrat
section_title: "These operations can be performed by administrators."
file: "epersons.md"
lines: 124-168
source_sha256: f15d99d416d78ed5
granularity: heading
---
#### These operations can be performed by administrators.

To replace the certificate required value, `curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson> -H "Content-Type: application/json" -d '[{ "op": "replace", "path": "/certificate", "value": "true|false"]'`.  The operation also requires an Authorization header.

For example, starting with the following eperson field data:
```json
 "requireCerticate": true,
```
the replace operation `[{ "op": "replace", "path": "/certificate", "value": "false"]` will result in :
```json
  "requireCerticate": false,
```

To replace the canLogin value, `curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson> -H "Content-Type: application/json" -d '[{ "op": "replace", "path": "/canLogin", "value": "true|false"]'`.  The operation also requires an Authorization header.

For example, starting with the following eperson field data:
```json
 "canLogIn": true,
```
the replace operation `[{ "op": "replace", "path": "/canLogin", "value": "false"` will result in :
```json
  "canLogIn": false,
```
To replace the netid value, `curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson> -H "Content-Type: application/json" -d '[{ "op": "replace", "path": "/netid", "value": "newNetId"]'`.  The operation also requires an Authorization header.

For example, starting with the following eperson field data:
```json
 "netid": "oldNetId",
```
the replace operation `[{ "op": "replace", "path": "/netid", "value": "newNetId"]` will result in :
```json
  "netid": "newNetId",
```

To replace the email value, `curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson> -H "Content-Type: application/json" -d '[{ "op": "replace", "path": "/email", "value": "new@email"]'`.  The operation also requires an Authorization header.

For example, starting with the following eperson field data:
```json
 "email": "old@email",
```
the replace operation `[{ "op": "replace", "path": "/email", "value": "new@email"]` will result in :
```json
  "email": "new@email",
  ```
