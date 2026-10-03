---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s156-custom-headers-from-tool-parameters
section_title: "Custom Headers from Tool Parameters"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 356-370
source_sha256: 22574bf11e004068
granularity: heading
---
### Custom Headers from Tool Parameters

MCP servers **MAY** designate specific tool parameters to be mirrored into
HTTP headers using an `x-mcp-header` extension property in the parameter's
schema within the tool's `inputSchema`. See
[Tool Definitions][tool-definitions] for
details on how to annotate tool parameters.

While the use of `x-mcp-header` is optional for servers, clients **MUST**
support this feature. When a server's tool definition includes
`x-mcp-header` annotations, conforming clients **MUST** mirror the
designated parameter values into HTTP headers.

[tool-definitions]: /specification/2026-07-28/server/tools#x-mcp-header
