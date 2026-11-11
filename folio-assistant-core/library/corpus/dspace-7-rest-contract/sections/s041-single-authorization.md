---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s041-single-authorization
section_title: "Single Authorization"
file: "authorizations.md"
lines: 13-38
source_sha256: 3b81e267ca1b7f0c
granularity: heading
---
## Single Authorization
**/api/authz/authorizations/<:id>**

Provide detailed information about a specific authorization. The JSON response document is as follow

```json
{
  "id": [eperson-uuid_]feature-id_restobjectcategory.restobjectname_object-id,
  "type": "authorization"
}
```

Attributes
* id: the id of the authorization resource is defined by the combination of the eperson uuid (if not null), the feature id and the rest object category and name (combined with a dot) and (uu)id joined with an underscore 

Exposed links:
* eperson: link to the eperson that the authorization belong to. Can be null for authorizations grant to unlogged users
* feature: link to the feature enabled by this authorization
* object: link to the rest object where this authorization apply. Not limited to DSpace objects, potentially any BaseObjectRest (i.e. an addressable rest object with an Id) can be used

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated and the policy is not related to the ANONYMOUS user (eperson null)
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators and the user mentioned in the authorization can access
* 404 Not found - if the authorization doesn't exist (or was already deleted)
