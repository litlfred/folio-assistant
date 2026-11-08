---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s184-how-to-obtain-reset-a-csrf-token
section_title: "How to obtain/reset a CSRF token?"
file: "csrf-tokens.md"
lines: 7-13
source_sha256: fc474847e5e7ba0b
granularity: heading
---
## How to obtain/reset a CSRF token?

The CSRF token is sent automatically to the client in a prior request (often a `GET`) and may be changed during your session at any time. The client MUST watch for changes to the CSRF token in every request (although in practice the token should primarily only change during login/logout or authentication refresh, etc)
See [How does CSRF protection work in DSpace REST API?](#how-does-csrf-protection-work-in-dspace-rest-api) below for more details.

A `GET` endpoint is also available to force a CSRF token refresh. See below.
