---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s105-request-and-response
section_title: "Request and Response"
file: "docs/specification/2026-07-28/basic/patterns/index.mdx"
lines: 23-40
source_sha256: 9e08dd8b295cacc5
granularity: heading
---
## Request and Response

The client sends a request; the server answers it with a result or an error.
While the request is in flight, the server **MAY** send notifications scoped
to it, such as
[`notifications/progress`](/specification/2026-07-28/basic/patterns/progress)
and [`notifications/message`](/specification/2026-07-28/server/utilities/logging).

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: request
    Server-->>Client: notifications/progress (optional)
    Server-->>Client: response
```
