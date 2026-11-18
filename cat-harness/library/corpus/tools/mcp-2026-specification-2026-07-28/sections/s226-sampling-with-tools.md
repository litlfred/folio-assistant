---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s226-sampling-with-tools
section_title: "Sampling with Tools"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 164-277
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Sampling with Tools

The following diagram illustrates the complete flow of sampling with tools, including the multi-turn tool loop:

```mermaid
sequenceDiagram
    participant Server
    participant Client
    participant User
    participant LLM

    Client->>Server: tools/call(id:1)
    note right of Server: Server needs more info
    Server->>Client: InputRequiredResult(<br/>sampling/createMessage<br/>(messages + tools))

    Note over Client,User: Human-in-the-loop review
    Client->>User: Present request for approval
    User-->>Client: Approve/modify

    Client->>LLM: Forward request with tools
    LLM-->>Client: Response with tool_use<br/>(stopReason: "toolUse")

    Client->>User: Present tool calls for review
    User-->>Client: Approve tool calls
    Client-->>Server: tools/call(id:2, Return tool_use response)

    Note over Server: Execute tool(s)
    Server->>Server: Run get_weather("Paris")<br/>Run get_weather("London")

    Note over Server,Client: Continue with tool results
    Server->>Client: InputRequiredResult(<br/>sampling/createMessage<br/>(history + tool_results + tools))

    Client->>User: Present continuation
    User-->>Client: Approve

    Client->>LLM: Forward with tool results
    LLM-->>Client: Final text response<br/>(stopReason: "endTurn")

    Client->>User: Present response
    User-->>Client: Approve
    Client-->>Server: tools/call(id:3, Return final response)

    Note over Server: Server processes result<br/>(may continue conversation...)
```

To request LLM generation with tool use capabilities, servers include `tools` and optionally `toolChoice` in the request:

**Input request (Server -> Client, delivered inside `InputRequiredResult.inputRequests`):**

```json
{
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "What's the weather like in Paris and London?"
        }
      }
    ],
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "inputSchema": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["city"]
        }
      }
    ],
    "toolChoice": {
      "mode": "auto"
    },
    "maxTokens": 1000
  }
}
```

**Client result (Client -> Server, returned inside `inputResponses` on the retried request):**

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "call_abc123",
      "name": "get_weather",
      "input": {
        "city": "Paris"
      }
    },
    {
      "type": "tool_use",
      "id": "call_def456",
      "name": "get_weather",
      "input": {
        "city": "London"
      }
    }
  ],
  "model": "claude-3-sonnet-20240307",
  "stopReason": "toolUse"
}
```
