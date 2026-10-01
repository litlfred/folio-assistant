---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s110-multi-round-trip-requests
section_title: "Multi Round-Trip Requests"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 25-53
source_sha256: a8671eb2a0d292c0
granularity: heading
---
## Multi Round-Trip Requests

The Model Context Protocol (MCP) defines several ways for servers to request additional information
from users during the processing of client requests (such as
`roots/list`, `sampling/createMessage`, or `elicitation/create`). The **multi round-trip requests** pattern
provides a standardized way to handle these server-requests without requiring a shared storage layer across
server instances or requiring stateful load balancing.

The high level flow functions as follows:

1. Client sends an initial request to the server with the parameters needed to perform the operation.
1. Server determines that additional information is required to fulfill the request and responds requesting more information.
1. Client gathers the requested information from the user or other sources, then retries the original request including the additional requested information.
1. Server determines it has sufficient information to complete the operation, and responds with the final result.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: client request (id: 1, request params)
    note over S: Server needs more info <br/> to process request.
    S-->>C: Request for additional input.

    note over C: Client gathers input and <br/> retries initial request.
    C->>S: client request (id: 2, request params, requested input)
    note over S: Server has enough information <br/> to complete the request.
    S-->>C: Result (id: 2, result)
```
