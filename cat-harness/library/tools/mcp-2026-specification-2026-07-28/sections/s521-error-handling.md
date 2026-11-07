---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s521-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 185-193
source_sha256: 1965c563aadb99e1
granularity: heading
---
## Error Handling

Servers **SHOULD** return standard JSON-RPC errors for common failure cases:

- Method not found: `-32601` (Capability not supported)
- Invalid prompt name: `-32602` (Invalid params)
- Missing required arguments: `-32602` (Invalid params)
- Internal errors: `-32603` (Internal error)
