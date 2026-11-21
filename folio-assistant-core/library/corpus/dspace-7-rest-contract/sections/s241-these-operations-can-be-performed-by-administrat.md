---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s241-these-operations-can-be-performed-by-administrat
section_title: "These operations can be performed by administrators and by the authenticated user."
file: "epersons.md"
lines: 177-199
source_sha256: f15d99d416d78ed5
granularity: heading
---
#### These operations can be performed by administrators and by the authenticated user.

To add/replace the password value while authenticated, use
`curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson> -H "Content-Type: application/json" -d '[{ "op": "add", "path": "/password", "value": {"new_password": "newpassword", "current_password":"oldpassword"}}]'`.  
To add/replace the password value based on a registration token, use
`curl -X PATCH http://${dspace.url}/api/eperson/epersons/<:id-eperson>?token=<:token> -H "Content-Type: application/json" -d '[{ "op": "add", "path": "/password", "value": {"new_password": "newpassword"}}]'`.  
The operation requires an Authorization header or a token.

If the provided current_password is wrong, a response with status 403 Forbidden is returned.

For example, starting with the following eperson field data:
```json
 "password": "oldpassword",
```
the replace operation `[{ "op": "add", "path": "/password", "value": {"new_password": "newpassword", "current_password":"oldpassword"}}]` will result in :
```json
  "password": "newpassword",
```
Status codes:
* 422 Unprocessable Entity - If the provided password not respects the rules configured in the regular expression

NOTE: The new password is currently returned after an update but this could be revisited later, see [#30](https://github.com/DSpace/Rest7Contract/issues/30)
