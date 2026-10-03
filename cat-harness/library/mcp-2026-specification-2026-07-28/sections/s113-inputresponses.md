---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s113-inputresponses
section_title: "InputResponses"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 99-123
source_sha256: a8671eb2a0d292c0
granularity: heading
---
#### InputResponses

An [`InputResponses`](/specification/2026-07-28/schema#inputresponses) object is a map of client responses to the server requests.
Keys correspond to the keys in the `InputRequests` map; values are the client's result for each request (e.g., [`ElicitResult`](/specification/2026-07-28/schema#elicitresult), [`CreateMessageResult`](/specification/2026-07-28/schema#createmessageresult), or [`ListRootsResult`](/specification/2026-07-28/schema#listrootsresult)).

```json
{
  "github_login": {
    "action": "accept",
    "content": {
      "name": "octocat"
    }
  },
  "capital_of_france": {
    "role": "assistant",
    "content": {
      "type": "text",
      "text": "The capital of France is Paris."
    },
    "model": "claude-3-sonnet-20240307",
    "stopReason": "endTurn"
  }
}
```
