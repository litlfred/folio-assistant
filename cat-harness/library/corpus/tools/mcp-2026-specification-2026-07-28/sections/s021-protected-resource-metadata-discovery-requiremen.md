---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s021-protected-resource-metadata-discovery-requiremen
section_title: "Protected Resource Metadata Discovery Requirements"
file: "docs/specification/2026-07-28/basic/authorization/authorization-server-discovery.mdx"
lines: 37-54
source_sha256: 2d80118a0187d16f
granularity: heading
---
## Protected Resource Metadata Discovery Requirements

MCP servers **MUST** implement one of the following discovery mechanisms to provide authorization server location information to MCP clients:

1. **WWW-Authenticate Header**: Include the resource metadata URL in the `WWW-Authenticate` HTTP header under `resource_metadata` when returning `401 Unauthorized` responses, as described in [RFC9728 Section 5.1](https://datatracker.ietf.org/doc/html/rfc9728#name-www-authenticate-response).

2. **Well-Known URI**: Serve metadata at a well-known URI as specified in [RFC9728](https://datatracker.ietf.org/doc/html/rfc9728). This can be either:
   - At the path of the server's MCP endpoint: `https://example.com/public/mcp` could host metadata at `https://example.com/.well-known/oauth-protected-resource/public/mcp`
   - At the root: `https://example.com/.well-known/oauth-protected-resource`

MCP clients **MUST** support both discovery mechanisms and use the resource metadata URL from the parsed `WWW-Authenticate` headers when present; otherwise, they **MUST** fall back to constructing and requesting the well-known URIs in the order listed above.

MCP clients **MUST** be able to parse `WWW-Authenticate` headers and respond appropriately to `HTTP 401 Unauthorized` responses from the MCP server.

Servers can also include a `scope` parameter in the `WWW-Authenticate` challenge to indicate the
scopes required for accessing the resource; the scope semantics and the associated client behavior
are defined in the [Scope Selection Strategy](/specification/2026-07-28/basic/authorization#scope-selection-strategy) section.
