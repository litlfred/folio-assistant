---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s257-single-feature
section_title: "Single Feature"
file: "features.md"
lines: 19-45
source_sha256: 25a9fe5d65006021
granularity: heading
---
## Single Feature
**/api/authz/features/<:string>**

Provide detailed information about a specific feature. Access is restricted to system administrators. The JSON response document is as follow

```json
{
  "id": "withdrawItem",
  "description": "The feature allows to withdrawn an item from the repository without deleting it. The restoreItem feature allow to undo the process",
  "resourcetypes": [
  	"core.item"
  ],
  "type": "feature"
}
```

Attributes
* id: the id of the feature is an unique shortname
* description: an human readable description of the feature purpose 
* resourcetypes: an array of types of objects where this feature apply in the form of category.model as used in the REST API. Please note that the model is in its singular form (i.e. core.item, core.site, submission.workspaceitem, etc.)

Return codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only system administrators can access
* 404 Not found - if the feature doesn't exist
