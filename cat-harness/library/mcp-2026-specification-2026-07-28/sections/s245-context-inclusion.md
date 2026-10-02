---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s245-context-inclusion
section_title: "Context Inclusion"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 612-628
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Context Inclusion

The `includeContext` parameter specifies what context information the client is expected
to include in its response:

- `"none"`: No additional context.
- `"thisServer"`: Include context from the requesting server.
- `"allServers"`: Include context from all connected MCP servers.

The `"thisServer"` and `"allServers"` values are deprecated; see
[Capabilities](#capabilities).

The client **MAY** modify or ignore this field without communicating this to the server.
For example, a client could determine that respecting this field in a particular request
would require sharing sensitive information with a server, and constrain its response
accordingly.
