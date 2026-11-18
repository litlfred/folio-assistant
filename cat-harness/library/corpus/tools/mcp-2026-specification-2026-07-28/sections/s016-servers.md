---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s016-servers
section_title: "Servers"
file: "docs/specification/2026-07-28/architecture/index.mdx"
lines: 74-83
source_sha256: 9037b342a1f23c05
granularity: heading
---
### Servers

Servers provide specialized context and capabilities:

- Expose resources, tools and prompts via MCP primitives
- Operate independently with focused responsibilities
- Request client input (sampling, elicitation, roots) via `InputRequiredResult` within a reply
- Must respect security constraints
- Can be local processes or remote services
