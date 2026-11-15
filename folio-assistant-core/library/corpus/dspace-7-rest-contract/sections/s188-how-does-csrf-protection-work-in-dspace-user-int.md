---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s188-how-does-csrf-protection-work-in-dspace-user-int
section_title: "How does CSRF protection work in DSpace User Interface?"
file: "csrf-tokens.md"
lines: 60-71
source_sha256: fc474847e5e7ba0b
granularity: heading
---
## How does CSRF protection work in DSpace User Interface?

The DSpace User Interface includes some minor customizations to the default [CSRF protection built into Angular](https://angular.io/guide/http-security-xsrf-protection) based on the behavior of the backend.

Here's how it works:
1. The User Interface submits a request to the REST API which generates a CSRF Token (as described above).
2. The REST API sends the generated CSRF Token to the User Interface in an HTTP header named `DSPACE-XSRF-TOKEN`.
    * NOTE: The User Interface is unable to "see" the `DSPACE-XSRF-COOKIE` cookie where the REST API also stores this token.  This cookie has `HttpOnly` which makes it unreadable to Javascript. In addition, the User Interface and REST API may be on separate domains (which will often results in the web browser blocking the cross-domain cookie).
3. The User Interface reads the CSRF Token from the `DSPACE-XSRF-TOKEN` header and **stores it** in a client-side cookie named `XSRF-TOKEN` (as this is the default cookie name that Angular apps use for reading a CSRF token).
4. When the User Interface nexts sends a modifying request (`POST`, `PUT`, `PATCH`, `DELETE`, etc), it *reads* the current CSRF Token from the client-side `XSRF-TOKEN` cookie and then **copies it** into the `X-XSRF-TOKEN` HTTP Header to send back to the REST API.
5. On each later response from the REST API, the User Interface watches for changes to the CSRF Token by checking for the `DSPACE-XSRF-TOKEN` header.  If changes are found, it copies the new token into the client-side cookie named `XSRF-TOKEN` for future requests.
