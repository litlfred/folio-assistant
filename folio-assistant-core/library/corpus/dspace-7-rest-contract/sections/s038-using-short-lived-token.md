---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s038-using-short-lived-token
section_title: "Using short lived token"
file: "authentication.md"
lines: 200-207
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
### Using short lived token

The request parameter below can be used for nearly every REST endpoint to perform it with authentication but without needing the authentication header:
* **authentication-token**: optional parameter that authenticates a user, a token needs to be requested from the [following endpoint](authentication.md#Request-short-lived-token) 

The following endpoints are not allowed to use the authentication-token:
* **POST /api/authn/login**: refreshing your long-lived authentication header is not allowed using the short lived token
* **POST /api/authn/shortlivedtokens**: creating a new short lived token is not allowed using the short lived token
