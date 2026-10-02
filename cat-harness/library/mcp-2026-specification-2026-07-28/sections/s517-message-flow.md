---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s517-message-flow
section_title: "Message Flow"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 150-165
source_sha256: 1965c563aadb99e1
granularity: heading
---
## Message Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Note over Client: User types argument
    Client->>Server: completion/complete
    Server-->>Client: Completion suggestions

    Note over Client: User continues typing
    Client->>Server: completion/complete
    Server-->>Client: Refined suggestions
```
