---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s536-pagination-model
section_title: "Pagination Model"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 24-31
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
## Pagination Model

Pagination in MCP uses an opaque cursor-based approach, instead of numbered pages.

- The **cursor** is an opaque string token, representing a position in the result set
- **Page size** is determined by the server, and clients **MUST NOT** assume a fixed page
  size
