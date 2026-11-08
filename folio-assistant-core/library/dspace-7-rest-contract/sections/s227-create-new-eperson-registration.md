---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s227-create-new-eperson-registration
section_title: "Create new EPerson registration"
file: "epersonregistrations.md"
lines: 35-60
source_sha256: 1c3d12225c2a3062
granularity: heading
---
## Create new EPerson registration
**POST /api/eperson/registrations?accountRequestType={requestType_forgot_or_register}**

To create a new EPerson registration, perform a post with the JSON below to the eperson registrations endpoint (without being authenticated).

```json
{
  "email": "user@institution.edu",
  "type": "registration"
}
```

Requires query parameter 'accountRequestType' set with either 'register' or 'forgot' value, depending on the action requested.

No other properties can be set (e.g. the name cannot be defined)
If successful, an email will be sent with a token allowing the user to continue the registration

Verifying whether a new registration can be created can happen using the "epersonRegistration" [feature](features.md), verified against the site

Status codes:
* 201 Created - if the operation succeed
* 400 Bad Request - if e.g. the query param 'accountRequestType' is not present or contains something else than forgot or register
* 401 Unauthorized - if registration is disabled, you are not authorized to create a new registration
* 422 Unprocessable Entity - if the email address was omitted or the e-mail address is in a domain that is not allowed in config `authentication-password.domain.valid`
