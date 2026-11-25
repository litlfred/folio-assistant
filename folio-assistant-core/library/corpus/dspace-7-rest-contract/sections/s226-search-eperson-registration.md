---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s226-search-eperson-registration
section_title: "Search EPerson registration"
file: "epersonregistrations.md"
lines: 13-34
source_sha256: 1c3d12225c2a3062
granularity: heading
---
## Search EPerson registration
**/api/eperson/registrations/search/findByToken?token=<:token>**

Exposes the registered email address based on the token.  
Also exposes whether it's a new user registration, or a password reset for an existing user.

```json
{
  "email": "user@institution.edu",
  "user": null,
  "type": "registration"
}
```

```json
{
  "email": "user@institution.edu",
  "user": "028dcbb8-0da2-4122-a0ea-254be49ca107",
  "type": "registration"
}
```
