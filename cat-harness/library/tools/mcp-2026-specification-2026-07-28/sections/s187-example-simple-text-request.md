---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s187-example-simple-text-request
section_title: "Example: Simple Text Request"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 241-274
source_sha256: 74351d1081681695
granularity: heading
---
#### Example: Simple Text Request

**Input request (delivered inside [`InputRequiredResult.inputRequests`](/specification/2026-07-28/basic/patterns/mrtr#inputrequests)):**

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "form",
    "message": "Please provide your GitHub username",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": ["name"]
    }
  }
}
```

**Client result (returned inside `inputResponses` on the retried request):**

```json
{
  "action": "accept",
  "content": {
    "name": "octocat"
  }
}
```
