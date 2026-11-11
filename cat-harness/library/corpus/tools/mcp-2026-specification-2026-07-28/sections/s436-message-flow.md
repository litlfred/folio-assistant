---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s436-message-flow
section_title: "Message Flow"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 181-205
source_sha256: 85e550635bbbbaa9
granularity: heading
---
## Message Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Note over Client,Server: Discovery
    Client->>Server: prompts/list
    Server-->>Client: List of prompts

    Note over Client,Server: Usage
    Client->>Server: prompts/get
    Server-->>Client: Prompt content

    opt listChanged
      Client->>Server: subscriptions/listen (promptsListChanged: true)
      Server--)Client: notifications/subscriptions/acknowledged
      Note over Client,Server: Changes
      Server--)Client: notifications/prompts/list_changed
      Client->>Server: prompts/list
      Server-->>Client: Updated prompts
    end
```
