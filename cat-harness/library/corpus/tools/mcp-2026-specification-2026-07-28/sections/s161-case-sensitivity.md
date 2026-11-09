---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s161-case-sensitivity
section_title: "Case Sensitivity"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 570-579
source_sha256: 22574bf11e004068
granularity: heading
---
### Case Sensitivity

Header names (called "field names" in
[RFC 9110][rfc9110-names])
are case-insensitive. Clients and servers **MUST** use case-insensitive
comparisons for header names. Header _values_ (such as method names) are
case-sensitive.

[rfc9110-names]: https://datatracker.ietf.org/doc/html/rfc9110#name-field-names
