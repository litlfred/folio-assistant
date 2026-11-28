---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s205-create-new-eperson-group
section_title: "Create new EPerson Group"
file: "epersongroups.md"
lines: 37-64
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
## Create new EPerson Group

**POST /api/eperson/groups**

To create a new EPerson Group, perform a post with the JSON below to the epersons endpoint when logged in as admin.

```json
{
  "name": "New Group 1",
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

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 Unprocessable Entity - if the name was omitted or already exists, if permanent was set to true
