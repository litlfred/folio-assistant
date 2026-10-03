---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s039-roles
section_title: "Roles"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 47-59
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Roles

A protected _MCP server_ acts as an [OAuth 2.1 resource server](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-13.html#name-roles),
capable of accepting and responding to protected resource requests using access tokens.

An _MCP client_ acts as an [OAuth 2.1 client](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-13.html#name-roles),
making protected resource requests on behalf of a resource owner.

The _authorization server_ is responsible for interacting with the user (if necessary) and issuing access tokens for use at the MCP server.
The implementation details of the authorization server are beyond the scope of this specification. It may be hosted with the
resource server or a separate entity. [Authorization Server Discovery](/specification/2026-07-28/basic/authorization/authorization-server-discovery)
specifies how an MCP server indicates the location of its corresponding authorization server to a client.
