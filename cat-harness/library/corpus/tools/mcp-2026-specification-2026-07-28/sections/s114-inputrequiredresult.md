---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s114-inputrequiredresult
section_title: "InputRequiredResult"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 124-181
source_sha256: a8671eb2a0d292c0
granularity: heading
---
#### InputRequiredResult

An [`InputRequiredResult`](/specification/2026-07-28/schema#inputrequiredresult) is a type of [`Result`](/specification/2026-07-28/basic#responses),
indicating that additional input is needed before the request can be completed.

- `inputRequests` _(optional)_: An [`InputRequests`](/specification/2026-07-28/schema#inputrequests) map of server-initiated requests that the client must fulfill.
- `requestState` _(optional)_: An opaque string meaningful only to the server. Clients **MUST NOT** inspect, parse, modify, or make any assumptions about its contents.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      // Elicitation request.
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
      // Sampling request.
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
          "modelPreferences": {
            "hints": [{ "name": "claude-3-sonnet" }],
            "intelligencePriority": 0.8,
            "speedPriority": 0.5
          },
          "systemPrompt": "You are a helpful assistant.",
          "maxTokens": 100
        }
      }
    },
    "requestState": "AEAD-protected blob"
  }
}
```
