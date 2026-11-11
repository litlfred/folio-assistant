---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s106-multi-round-trip-requests
section_title: "Multi Round-Trip Requests"
file: "docs/specification/2026-07-28/basic/patterns/index.mdx"
lines: 41-59
source_sha256: 9e08dd8b295cacc5
granularity: heading
---
## Multi Round-Trip Requests

When a server needs client input (sampling, elicitation, or roots) to
complete a request, it answers with an
[`InputRequiredResult`](/specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult)
and the client retries the request with the matching `inputResponses`. See
[Multi Round-Trip Requests](/specification/2026-07-28/basic/patterns/mrtr).

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: request (id: 1)
    Server-->>Client: InputRequiredResult (inputRequests)
    Client->>Server: request (id: 2, original params + inputResponses)
    Server-->>Client: response
```
