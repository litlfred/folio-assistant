---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s183-csrf-protection
section_title: "CSRF Protection"
file: "csrf-tokens.md"
lines: 1-6
source_sha256: fc474847e5e7ba0b
granularity: heading
---
# CSRF Protection
[REST Overview Documentation](README.md)

All modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`, etc) **require** that the client send a valid CSRF token
in the `X-XSRF-TOKEN` header, otherwise a `403 Forbidden` error will occur.
