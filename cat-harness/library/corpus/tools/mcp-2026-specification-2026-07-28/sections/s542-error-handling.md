---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s542-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 109-111
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
## Error Handling

Invalid cursors **SHOULD** result in an error with code -32602 (Invalid params).
