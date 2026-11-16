---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s066-authorization-server-abuse-protection
section_title: "Authorization Server Abuse Protection"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 88-92
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
### Authorization Server Abuse Protection

Authorization servers fetching metadata documents **SHOULD** consider
[Server-Side Request Forgery (SSRF)](https://developer.mozilla.org/docs/Web/Security/Attacks/SSRF) risks, as described in [OAuth Client ID Metadata Document: Server Side Request Forgery (SSRF) Attacks](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00#name-server-side-request-forgery).
