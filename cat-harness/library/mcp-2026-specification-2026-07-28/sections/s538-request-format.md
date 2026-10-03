---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s538-request-format
section_title: "Request Format"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 53-68
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
## Request Format

After receiving a cursor, the client can _continue_ paginating by issuing a request
including that cursor:

```json
{
  "jsonrpc": "2.0",
  "id": "124",
  "method": "resources/list",
  "params": {
    "cursor": "eyJwYWdlIjogMn0="
  }
}
```
