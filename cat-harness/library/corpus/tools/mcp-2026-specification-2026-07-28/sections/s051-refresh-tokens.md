---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s051-refresh-tokens
section_title: "Refresh Tokens"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 299-314
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Refresh Tokens

This section provides guidance for MCP Clients and MCP Servers when handling or issuing
refresh tokens for both OAuth and OpenID Connect.

**MCP Clients** that desire refresh tokens:

- **MUST** keep refresh tokens confidential in transit and storage as specified in [OAuth 2.1 Section 4.3](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-14#section-4.3)
- **SHOULD** include `refresh_token` in their `grant_types` client metadata
- **MAY** add `offline_access` to the `scope` parameter of the authorization and token requests when the Authorization Server metadata contains it in `scopes_supported`
- **MUST NOT** assume refresh tokens will be issued; the AS retains discretion

**MCP Servers** (Protected Resources) **SHOULD NOT** include `offline_access` in
`WWW-Authenticate` scope or Protected Resource Metadata `scopes_supported`, as refresh
tokens are not a resource requirement.
