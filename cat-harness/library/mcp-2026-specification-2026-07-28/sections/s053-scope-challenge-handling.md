---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s053-scope-challenge-handling
section_title: "Scope Challenge Handling"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 325-331
source_sha256: 99e7eeaecad53816
granularity: heading
---
### Scope Challenge Handling

This section covers handling insufficient scope errors during runtime operations when
a client already has a token but needs additional permissions. This follows the error
handling patterns defined in [OAuth 2.1 Section 5](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13#section-5)
and leverages the metadata fields from [RFC 9728 (OAuth 2.0 Protected Resource Metadata)](https://datatracker.ietf.org/doc/html/rfc9728).
