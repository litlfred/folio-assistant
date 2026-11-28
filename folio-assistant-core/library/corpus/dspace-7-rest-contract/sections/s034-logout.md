---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s034-logout
section_title: "Logout"
file: "authentication.md"
lines: 64-84
source_sha256: 5fe6b72a7fccbca6
granularity: heading
---
## Logout
**POST /api/authn/logout**

This endpoint only accepts the `POST` method.

To logout and invalidate the JWT token, send the token in the `Authorization` header with the bearer scheme.

```
curl -v -X POST "https://{dspace-server.url}/api/authn/logout" -H "Authorization: Bearer eyJhbG...COdbo" -H "X-XSRF-TOKEN: {csrf-token}"
```

This invalidates the token on the server side which will results in logging out the user _on every device or browser_. It can also be called with params **action** and **return**, required by the Shibboleth Single Logout (front channel), with the same behaviour.

As this endpoint requires a POST, it requires passing a valid [CSRF token](csrf-tokens.md).

Return code
- 204 No content.
- 302 Found. If a successful logout occurs, and a logout page URL is configured

Invalid or missing tokens are not reported, i.e. the endpoint will always return 204 also if no token is supplied, or the token is invalid
