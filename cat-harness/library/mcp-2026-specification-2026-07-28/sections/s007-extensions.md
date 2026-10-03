---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s007-extensions
section_title: "Extensions"
file: "docs/specification/2026-07-28/index.mdx"
lines: 75-88
source_sha256: c8151ab8d7f26ab4
granularity: heading
---
### Extensions

Beyond the core protocol, MCP defines optional [extensions](/extensions/overview)
that add modular, specialized, or experimental functionality. Extensions
are always opt-in and require explicit support from both client and server, negotiated
during initialization. Notable extensions include:

- **[Tasks](/extensions/tasks/overview)**: Asynchronous execution of long-running
  operations, with polling, mid-flight input, and durable handles
- **[Skills over MCP](/community/working-groups/skills-over-mcp)**: Rich, structured
  instructions for agent workflows, discovered and consumed through MCP
- **[MCP Apps](/extensions/apps/overview)**: Interactive UI elements (charts, forms,
  video players) rendered inline within conversations
