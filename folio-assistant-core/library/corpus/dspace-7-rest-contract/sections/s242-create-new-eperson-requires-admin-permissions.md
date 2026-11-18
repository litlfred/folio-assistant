---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s242-create-new-eperson-requires-admin-permissions
section_title: "Create new EPerson (requires admin permissions)"
file: "epersons.md"
lines: 200-239
source_sha256: f15d99d416d78ed5
granularity: heading
---
## Create new EPerson (requires admin permissions)
**POST /api/eperson/epersons**

To create a new EPerson, perform a post with the JSON below to the epersons endpoint when logged in as admin.

```json
{
  "name": "user@institution.edu",
  "metadata": {
    "eperson.firstname": [
      {
        "value": "John",
        "language": null,
        "authority": "",
        "confidence": -1
      }
    ],
    "eperson.lastname": [
      {
        "value": "Doe",
        "language": null,
        "authority": "",
        "confidence": -1
      }
    ]
  },
  "canLogIn": true,
  "email": "user@institution.edu",
  "requireCertificate": false,
  "selfRegistered": true,
  "type": "eperson"
}
```

Status codes:
* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 Unprocessable Entity - if the email address was omitted or already exists
