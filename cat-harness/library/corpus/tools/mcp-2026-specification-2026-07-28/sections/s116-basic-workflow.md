---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s116-basic-workflow
section_title: "Basic Workflow"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 194-223
source_sha256: a8671eb2a0d292c0
granularity: heading
---
### Basic Workflow

The basic workflow describes how a server can request additional input from the client as part of a client-server request.
In this example we use `tools/call` as the client request, but the same pattern applies to any of the supported requests listed above.

Notably, it allows servers to request additional information without maintaining any server-side state.
The server encodes any needed context into the `requestState` field, which the client echoes back on retry.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    C->>S: tools/call (id: 1)
    note over S: Server needs more info via Elicitation
    S-->>C: InputRequiredResult (id: 1, ElicitRequest, requestState)
    note over C,S: Initial Request Terminated

    C->>U: Prompts user for input
    U-->>C: Provides responses

    note over C: Client retries tool call <br/> with inputResponses and requestState
    C->>S: tools/call (id: 2, ElicitResult, requestState)
    note over S: Server reconstitutes state<br/>Completes execution
    S-->>C: Result (id: 2, ToolCallResult)
```

Note that the requests in each step are completely independent: the server processing the retry does not need any information beyond
what is directly present in the retry request.
