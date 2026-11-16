---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s140-create-collection-administrators-group
section_title: "Create collection administrators group"
file: "collections.md"
lines: 563-592
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
##### Create collection administrators group
**POST /api/core/collections/<:uuid>/adminGroup**

To be used on a collection without collection administrators

Perform a post with the JSON below.

```json
{
  "metadata": {
      "dc.description": [
        {
          "value": "Test group",
          "language": null,
          "authority": "",
          "confidence": -1
        }
      ]
  }
}
```
Contrary to the [EPerson Group endpoint](epersongroups.md#create-new-eperson-group), the name cannot be set here

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. Only admins and parent community admins can retrieve the group
* 404 Not found - if the collection doesn't exist
* 422 Unprocessable Entity - if the name was included, if permanent was set to true, or if the collection already contains an administrator group
