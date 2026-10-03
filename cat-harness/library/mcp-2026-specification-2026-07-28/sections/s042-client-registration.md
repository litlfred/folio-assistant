---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s042-client-registration
section_title: "Client Registration"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 90-96
source_sha256: 99e7eeaecad53816
granularity: heading
---
## Client Registration

Before initiating the authorization flow, MCP clients **MUST** obtain a client ID through
one of three registration mechanisms: Client ID Metadata Documents, pre-registration, or
Dynamic Client Registration, following the requirements and selection priority defined in
[Client Registration](/specification/2026-07-28/basic/authorization/client-registration).
