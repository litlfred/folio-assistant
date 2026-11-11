---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s212-message-flow
section_title: "Message Flow"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 81-93
source_sha256: 016aea34d76ccce8
granularity: heading
---
## Message Flow

```mermaid
sequenceDiagram
    participant Server
    participant Client

    Note over Server,Client: Initial Request
    Client->>Server: tools/call(id: 1)
    Server-->>Client: InputRequiredResult(roots/list)
    Client->>Server: tools/call(id: 2, inputResponses{key: roots} + requestState)
```
