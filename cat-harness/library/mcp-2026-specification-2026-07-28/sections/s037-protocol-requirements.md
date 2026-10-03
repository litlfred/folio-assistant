---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s037-protocol-requirements
section_title: "Protocol Requirements"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 16-25
source_sha256: 99e7eeaecad53816
granularity: heading
---
### Protocol Requirements

Authorization is **OPTIONAL** for MCP implementations. When supported:

- Implementations using an HTTP-based transport **SHOULD** conform to this specification.
- Implementations using an STDIO transport **SHOULD NOT** follow this specification, and
  instead retrieve credentials from the environment.
- Implementations using alternative transports **MUST** follow established security best
  practices for their protocol.
