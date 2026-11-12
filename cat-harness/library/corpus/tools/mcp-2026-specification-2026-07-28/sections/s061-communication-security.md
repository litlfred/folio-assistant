---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s061-communication-security
section_title: "Communication Security"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 36-44
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
## Communication Security

Implementations **MUST** follow [OAuth 2.1 Section 1.5 "Communication Security"](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13#section-1.5).

Specifically:

1. All authorization server endpoints **MUST** be served over HTTPS.
1. All redirect URIs **MUST** be either `localhost` or use HTTPS.
