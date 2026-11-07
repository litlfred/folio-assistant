---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s029-login
section_title: "Login"
file: "authentication.md"
lines: 8-20
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
## Login
**POST /api/authn/login**

This endpoint only accepts the `POST` method. Parameters and body structure depend on the authentication method to use.

A `WWW-Authenticate` header is returned listing the different authentication method supported by the system.
Below an example listing the password and shibboleth authentication:  
`WWW-Authenticate: shibboleth realm="DSpace REST API", location="https://demo.dspace.org/Shibboleth.sso/Login?target=https%3A%2F%2Fdemo.dspace.org", password realm="DSpace REST API"`

Return codes
- 200 Ok. If the authentication succeed. The JWT will be returned in the response Header Authorization. 
- 401 Unauthorized. If the login fails. The response Header WWW-Authentication must be inspected to discover the supported authentication method
