---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s020-authorization-server-location
section_title: "Authorization Server Location"
file: "docs/specification/2026-07-28/basic/authorization/authorization-server-discovery.mdx"
lines: 11-36
source_sha256: 2d80118a0187d16f
granularity: heading
---
## Authorization Server Location

MCP servers **MUST** implement the OAuth 2.0 Protected Resource Metadata ([RFC9728](https://datatracker.ietf.org/doc/html/rfc9728))
specification to indicate the locations of authorization servers. The Protected Resource Metadata document returned by the MCP server **MUST** include
the `authorization_servers` field containing at least one authorization server.

The specific use of `authorization_servers` is beyond the scope of this specification; implementers should consult
OAuth 2.0 Protected Resource Metadata ([RFC9728](https://datatracker.ietf.org/doc/html/rfc9728)) for
guidance on implementation details.

Implementors should note that Protected Resource Metadata documents
can define multiple authorization servers. The responsibility for
selecting which authorization server to use lies with the MCP client,
following the guidelines specified in
[RFC9728 Section 7.6 "Authorization Servers"](https://datatracker.ietf.org/doc/html/rfc9728#name-authorization-servers).

When multiple authorization servers are listed in `authorization_servers`, each is an
independent OAuth 2.0 authorization server. Consistent with
[RFC 6749 Section 2.2](https://datatracker.ietf.org/doc/html/rfc6749#section-2.2), client
identifiers are unique to the authorization server that issued them. Clients **MUST** maintain
separate registration state (client credentials, tokens) per authorization server and
**MUST NOT** assume that credentials valid for one authorization server will be accepted by
another. See
[Authorization Server Binding](/specification/2026-07-28/basic/authorization/client-registration#authorization-server-binding)
for the requirements on associating client credentials with the authorization server that issued them.
