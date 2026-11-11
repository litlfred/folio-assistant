---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s049-token-requirements
section_title: "Token Requirements"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 256-280
source_sha256: 99e7eeaecad53816
granularity: heading
---
### Token Requirements

Access token handling when making requests to MCP servers **MUST** conform to the requirements defined in
[OAuth 2.1 Section 5 "Resource Requests"](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13#section-5).
Specifically:

1. MCP client **MUST** use the Authorization request header field defined in
   [OAuth 2.1 Section 5.1.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13#section-5.1.1):

```
Authorization: Bearer <access-token>
```

Note that authorization **MUST** be included in every HTTP request from client to server.

2. Access tokens **MUST NOT** be included in the URI query string

Example request:

```http
GET /mcp HTTP/1.1
Host: mcp.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
