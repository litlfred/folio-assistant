---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s243-create-new-eperson-based-on-registration-token
section_title: "Create new EPerson based on registration token"
file: "epersons.md"
lines: 240-281
source_sha256: f15d99d416d78ed5
granularity: heading
---
## Create new EPerson based on registration token
**POST /api/eperson/epersons?token=<:token>**

To create a new EPerson, perform a post with the JSON below to the epersons endpoint while including a token.
The token will be sent via Email from the [Create new EPerson registration](epersonregistrations.md#create-new-eperson-registration).

```json
{
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
  "requireCertificate": false,
  "type": "eperson"
}
```

The "eperson.firstname" and "eperson.lastname" metadata are mandatory. The phone number, language, … are optional metadata.  
The email property can be set, but would need to be identical to the value from the registration.  
The selfRegistered property can be set, but would need to be true

Status codes:
* 201 Created - if the operation succeed
* 400 Bad Request - if the email address didn't match the token or already exists. If the token doesn't exist or is expired
* 401 Unauthorized - if the token doesn't allow you to create this account
* 422 Unprocessable Entity - If the provided password not respects the rules configured in the regular expression
