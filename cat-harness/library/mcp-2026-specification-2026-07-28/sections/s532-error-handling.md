---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s532-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 98-106
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
## Error Handling

If the `io.modelcontextprotocol/logLevel` value carried in a request's `_meta`
is not a recognized [log level](#log-levels), the server **SHOULD** reject that
request with a standard JSON-RPC error:

- Invalid log level: `-32602` (Invalid params)
- Internal errors: `-32603` (Internal error)
