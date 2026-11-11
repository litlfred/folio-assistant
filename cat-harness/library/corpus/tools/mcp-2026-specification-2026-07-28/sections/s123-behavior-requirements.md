---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s123-behavior-requirements
section_title: "Behavior Requirements"
file: "docs/specification/2026-07-28/basic/patterns/progress.mdx"
lines: 58-85
source_sha256: 9f55aca08920c633
granularity: heading
---
## Behavior Requirements

1. Progress notifications **MUST** only reference tokens that:
   - Were provided in an active request
   - Are associated with an in-progress operation

2. Servers receiving a request with a progress token **MAY**:
   - Choose not to send any progress notifications
   - Send notifications at whatever frequency they deem appropriate
   - Omit the total value if unknown

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Note over Client,Server: Request with progress token
    Client->>Server: Method request with progressToken

    Note over Client,Server: Progress updates
    Server-->>Client: Progress notification (0.2/1.0)
    Server-->>Client: Progress notification (0.6/1.0)
    Server-->>Client: Progress notification (1.0/1.0)

    Note over Client,Server: Operation complete
    Server->>Client: Method response
```
