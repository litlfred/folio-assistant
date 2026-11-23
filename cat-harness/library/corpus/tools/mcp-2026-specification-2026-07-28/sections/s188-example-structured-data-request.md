---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s188-example-structured-data-request
section_title: "Example: Structured Data Request"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 275-321
source_sha256: 74351d1081681695
granularity: heading
---
#### Example: Structured Data Request

**Input request (delivered inside `InputRequiredResult.inputRequests`):**

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "form",
    "message": "Please provide your contact information",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Your full name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "description": "Your email address"
        },
        "age": {
          "type": "number",
          "minimum": 18,
          "description": "Your age"
        }
      },
      "required": ["name", "email"]
    }
  }
}
```

**Client result (returned inside `inputResponses` on the retried request):**

```json
{
  "action": "accept",
  "content": {
    "name": "Monalisa Octocat",
    "email": "octocat@github.com",
    "age": 30
  }
}
```
