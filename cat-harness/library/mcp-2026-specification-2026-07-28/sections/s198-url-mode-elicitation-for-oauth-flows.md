---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s198-url-mode-elicitation-for-oauth-flows
section_title: "URL Mode Elicitation for OAuth Flows"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 500-504
source_sha256: 74351d1081681695
granularity: heading
---
### URL Mode Elicitation for OAuth Flows

URL mode elicitation enables a pattern where MCP servers act as OAuth clients to third-party resource servers.
Authorization with external APIs enabled by URL mode elicitation is separate from [MCP authorization](../basic/authorization). MCP servers **MUST NOT** rely on URL mode elicitation to authorize users for themselves.
