---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s166-create-community-administrators-group
section_title: "Create Community administrators group"
file: "communities.md"
lines: 229-258
source_sha256: 91351bf44765781b
granularity: heading
---
##### Create Community administrators group
**POST /api/core/communities/<:uuid>/adminGroup**

To be used on a community without Community administrators

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
* 404 Not found - if the community doesn't exist
* 422 Unprocessable Entity - if the name was included, if permanent was set to true, or if the community already contains an administrator group
