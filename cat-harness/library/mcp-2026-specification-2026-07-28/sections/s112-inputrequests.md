---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s112-inputrequests
section_title: "InputRequests"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 58-98
source_sha256: a8671eb2a0d292c0
granularity: heading
---
#### InputRequests

An [`InputRequests`](/specification/2026-07-28/schema#inputrequests) object is a map of server-client requests.
Keys are server-assigned string identifiers;
values are request objects (e.g., [`ElicitRequest`](/specification/2026-07-28/schema#elicitrequest), [`CreateMessageRequest`](/specification/2026-07-28/schema#createmessagerequest), or [`ListRootsRequest`](/specification/2026-07-28/schema#listrootsrequest)).

```json
{
  "github_login": {
    "method": "elicitation/create",
    "params": {
      "mode": "form",
      "message": "Please provide your GitHub username",
      "requestedSchema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" }
        },
        "required": ["name"]
      }
    }
  },
  "capital_of_france": {
    "method": "sampling/createMessage",
    "params": {
      "messages": [
        {
          "role": "user",
          "content": {
            "type": "text",
            "text": "What is the capital of France?"
          }
        }
      ],
      "systemPrompt": "You are a helpful assistant.",
      "maxTokens": 100
    }
  }
}
```
