---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s022-authorization-server-metadata-discovery
section_title: "Authorization Server Metadata Discovery"
file: "docs/specification/2026-07-28/basic/authorization/authorization-server-discovery.mdx"
lines: 55-95
source_sha256: 2d80118a0187d16f
granularity: heading
---
## Authorization Server Metadata Discovery

MCP uses the default `oauth-authorization-server` well-known URI
suffix defined in
[RFC 8414 Section 3.1](https://datatracker.ietf.org/doc/html/rfc8414#section-3.1)
for authorization server metadata discovery. MCP does not define
an application-specific well-known URI suffix.

To handle different issuer URL formats and ensure
interoperability with both OAuth 2.0 Authorization Server
Metadata and OpenID Connect Discovery 1.0 specifications, MCP
clients **MUST** attempt multiple well-known endpoints when
discovering authorization server metadata.

The discovery approach is based on
[RFC 8414 Section 3.1 "Authorization Server Metadata Request"](https://datatracker.ietf.org/doc/html/rfc8414#section-3.1)
for OAuth 2.0 Authorization Server Metadata discovery and
[RFC 8414 Section 5 "Compatibility Notes"](https://datatracker.ietf.org/doc/html/rfc8414#section-5)
for OpenID Connect Discovery 1.0 interoperability.

For issuer URLs with path components
(e.g., `https://auth.example.com/tenant1`), clients **MUST**
try endpoints in the following priority order:

1. OAuth 2.0 Authorization Server Metadata with path insertion:
   `https://auth.example.com/.well-known/oauth-authorization-server/tenant1`
2. OpenID Connect Discovery 1.0 with path insertion:
   `https://auth.example.com/.well-known/openid-configuration/tenant1`
3. OpenID Connect Discovery 1.0 path appending:
   `https://auth.example.com/tenant1/.well-known/openid-configuration`

For issuer URLs without path components
(e.g., `https://auth.example.com`), clients **MUST** try:

1. OAuth 2.0 Authorization Server Metadata:
   `https://auth.example.com/.well-known/oauth-authorization-server`
2. OpenID Connect Discovery 1.0:
   `https://auth.example.com/.well-known/openid-configuration`

After retrieving a metadata document, MCP clients **MUST** validate it as required by [RFC8414 Section 3.3](https://datatracker.ietf.org/doc/html/rfc8414#section-3.3) or [OpenID Connect Discovery Section 4.3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation): the `issuer` value in the document **MUST** be identical to the issuer identifier used to construct the well-known URL. If they differ, the client **MUST NOT** use the metadata. For example, a document fetched from `https://attacker.example/.well-known/oauth-authorization-server` that contains `"issuer": "https://honest.example"` **MUST** be rejected.
