---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s185-get-api-security-csrf
section_title: "GET /api/security/csrf"
file: "csrf-tokens.md"
lines: 14-23
source_sha256: fc474847e5e7ba0b
granularity: heading
---
### GET /api/security/csrf

Provides a new CSRF Token to the client for usage in later requests. This endpoint SHOULD BE USED SPARINGLY as every call to this endpoint will create a new CSRF token. The DSpace REST API automatically manages CSRF tokens and sends them back to the client _only when the token needs to be changed_ (e.g. on login/logout, etc). Using this endpoint to refresh CSRF tokens frequently may result in unexpected behaviors or even performance issues on the client side. The primary purpose of this endpoint is to obtain the *first* CSRF token (if not yet sent by the REST API).

This endpoint returns an empty response with the newly generated CSRF Token in the `DSPACE-XSRF-TOKEN` HTTP Header. It will also save this CSRF Token to the `DSPACE-XSRF-COOKIE` server-side Cookie, for later verification. See [How does CSRF protection work in DSpace REST API?](#how-does-csrf-protection-work-in-dspace-rest-api) below for more details about this header and cookie.

Error codes:
* 204 No Content - if the operation succeeded no body will be returned. The new token will be returned in the CSRF header and cookie.
* 403 Forbidden - This endpoint will only respond to GET requests. All other requests types (POST/PUT) will return a 403.
