---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s041-authorization-server-discovery
section_title: "Authorization Server Discovery"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 82-89
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Authorization Server Discovery

MCP servers advertise their associated authorization servers through OAuth 2.0 Protected
Resource Metadata, and MCP clients determine authorization server endpoints and supported
capabilities through authorization server metadata discovery. Implementations **MUST**
follow the normative discovery requirements defined in
[Authorization Server Discovery](/specification/2026-07-28/basic/authorization/authorization-server-discovery).
