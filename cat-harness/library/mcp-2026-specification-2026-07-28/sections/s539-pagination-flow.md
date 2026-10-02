---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s539-pagination-flow
section_title: "Pagination Flow"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 69-82
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
## Pagination Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: List Request (no cursor)
    loop Pagination Loop
      Server-->>Client: Page of results + nextCursor
      Client->>Server: List Request (with cursor)
    end
```
