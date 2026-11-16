---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s186-what-is-csrf-and-why-is-this-necessary
section_title: "What is CSRF and why is this necessary?"
file: "csrf-tokens.md"
lines: 24-36
source_sha256: fc474847e5e7ba0b
granularity: heading
---
## What is CSRF and why is this necessary?

CSRF (or sometimes XSRF) refers to [Cross Site Request Forgery](https://owasp.org/www-community/attacks/csrf) attacks, where
an end user may be tricked into executing unwanted actions on a web application in which they are currently authenticated.

DSpace follows [OWASP guidelines to CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
by enabling [Spring Security's CSRF Protection](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#csrf)

DSpace uses a customized version of [Spring Security's CSRF Protection](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#csrf)
which also works cross-domain (allowing clients to be on entirely separate domains from the REST API).
Please keep in mind that clients on other domains *must* still be trusted by the REST API by configuring the [CORS (Cross-Origin Resource Sharing)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
`Access-Control-Allow-Origin` header. This is configurable via the `rest.cors.allowed-origins` configuration in the DSpace Backend.
