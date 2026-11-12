---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s479-message-flow
section_title: "Message Flow"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 250-279
source_sha256: ed550806a58eb774
granularity: heading
---
## Message Flow

```mermaid
sequenceDiagram
    participant LLM
    participant Client
    participant Server

    Note over Client,Server: Discovery
    Client->>Server: tools/list
    Server-->>Client: List of tools

    Note over Client,LLM: Tool Selection
    LLM->>Client: Select tool to use

    Note over Client,Server: Invocation
    Client->>Server: tools/call
    Server-->>Client: Tool result
    Client->>LLM: Process result

    opt listChanged
      Client->>Server: subscriptions/listen (toolsListChanged: true)
      Server--)Client: notifications/subscriptions/acknowledged
      Note over Client,Server: Updates
      Server--)Client: notifications/tools/list_changed
      Client->>Server: tools/list
      Server-->>Client: Updated tools
    end
```
