---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s067-localhost-redirect-uri-risks
section_title: "Localhost Redirect URI Risks"
file: "docs/specification/2026-07-28/basic/authorization/security-considerations.mdx"
lines: 93-102
source_sha256: 9b62204a9ff17eb1
granularity: heading
---
### Localhost Redirect URI Risks

Client ID Metadata Documents cannot prevent `localhost` URL impersonation by themselves.

Authorization servers:

- **SHOULD** display additional warnings for `localhost`-only redirect URIs
- **MAY** require additional attestation mechanisms for enhanced security
- **MUST** clearly display the redirect URI hostname during authorization
