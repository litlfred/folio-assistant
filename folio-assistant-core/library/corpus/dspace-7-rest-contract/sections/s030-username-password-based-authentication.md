---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s030-username-password-based-authentication
section_title: "Username Password based authentication"
file: "authentication.md"
lines: 21-35
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
### Username Password based authentication
Parameters must be sent in the body of a `x-www-form-urlencoded` request, i.e

```
curl -v -X POST https://{dspace-server.url}/server/api/authn/login --data "user=dspacedemo%2Badmin%40gmail.com&password=dspace" -H "X-XSRF-TOKEN: {csrf-token}" -b "DSPACE-XSRF-COOKIE={xsrf-cookie}"
```

Please note that authentication requires passing a valid [CSRF token](csrf-tokens.md) header and cookie, previously obtained from the REST API. Also note that `curl` assumes `-H 'Content-Type: application/x-www-form-urlencoded'` for a POST request as default.

This call will return a JWT (JSON Web Token) in the response in the Authorization header according to the [bearer scheme](https://datatracker.ietf.org/doc/html/rfc6750#section-2.1). This token has to be used in subsequent calls to provide your authentication details. For example:

```
curl -v "https://{dspace-server.url}/api/core/items" -H "Authorization: Bearer eyJhbG...COdbo"
```
