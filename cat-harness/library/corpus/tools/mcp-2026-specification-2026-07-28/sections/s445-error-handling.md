---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s445-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 319-326
source_sha256: 85e550635bbbbaa9
granularity: heading
---
## Error Handling

Servers **SHOULD** return standard JSON-RPC errors for common failure cases:

- Invalid prompt name: `-32602` (Invalid params)
- Missing required arguments: `-32602` (Invalid params)
- Internal errors: `-32603` (Internal error)
