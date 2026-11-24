---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s187-how-does-csrf-protection-work-in-dspace-rest-api
section_title: "How does CSRF protection work in DSpace REST API?"
file: "csrf-tokens.md"
lines: 37-59
source_sha256: fc474847e5e7ba0b
granularity: heading
---
## How does CSRF protection work in DSpace REST API?

The DSpace REST API (backend) uses [Spring Security's built-in CSRF Protection](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).  Specifically it uses a customized version of Spring Security's `CookieCsrfTokenRepository` to store the CSRF token in a cookie between requests as described below.

Here's how it works:

1. The DSpace REST API generates a CSRF Token (via Spring Security), storing it in a `HttpOnly` Cookie named `DSPACE-XSRF-COOKIE`, and sending
it back to the client in an HTTP header named `DSPACE-XSRF-TOKEN`.
   * This token is often generated on your first request to the REST API, but may also be updated at any time.
   * If your REST API is running via HTTP, then the `DSPACE-XSRF-COOKIE` Cookie will be created with `SameSite=Lax`. This setting means that the cookie will not be sent (by your browser) to any other domains. Effectively, this will block all logins from any domain that is not the same as the REST API. Therefore, we only recommend HTTP in development environments.
   * If your REST API is running via HTTPS, then the `DSPACE-XSRF-COOKIE` Cookie will be created with `SameSite=None; Secure`. This setting means the cookie will be sent cross domain, but only for HTTPS requests. This is recommended for all Production environments.
2. The client **MUST** store/keep a copy of this CSRF token (usually by watching for the `DSPACE-XSRF-TOKEN` header in every response),
and update that stored copy whenever a new token is sent.
   * For example, the [DSpace Angular UI](https://github.com/DSpace/dspace-angular) stores watches for this token from the `DSPACE-XSRF-TOKEN` header, and stores it in a client-side cookie named `XSRF-TOKEN` (as this is the default cookie name that Angular apps use for reading a CSRF token).  More information on how this works can be found below.
3. Whenever the client wishes to make a modifying request (`POST`, `PUT`, `PATCH`, `DELETE`, etc), 
the current CSRF token **MUST** be sent back in the `X-XSRF-TOKEN` header of the request.
   * Keep in mind that [authentication](authentication.md) (via `/api/authn/login`) requires `POST` and therefore also requires a valid CSRF token.
   * NOTE: non-modifying requests (`GET`, `HEAD`, `OPTIONS`, etc) do not require the token.
4. During a modifying request, the REST API will compare the value of the CSRF token in the request's
`X-XSRF-TOKEN` header to the value in the `DSPACE-XSRF-COOKIE` Cookie. If the values match, the request proceeds.
If the values do not match, a `403 Forbidden` error is returned.
   * Keep in mind that if the `DSPACE-XSRF-COOKIE` Cookie was blocked (or not sent back to the REST API) during this process, the same error will occur. So, you must ensure this Cookie is sent back (when using a browser this is usually done automatically, provided the `SameSite` settings allow it)
