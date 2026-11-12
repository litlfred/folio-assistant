---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s434-getting-a-prompt
section_title: "Getting a Prompt"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 122-166
source_sha256: 85e550635bbbbaa9
granularity: heading
---
### Getting a Prompt

To retrieve a specific prompt, clients send a `prompts/get` request. Arguments may be
auto-completed through [the completion API](/specification/2026-07-28/server/utilities/completion).

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "prompts/get",
  "params": {
    "name": "code_review",
    "arguments": {
      "code": "def hello():\n    print('world')"
    }
  }
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resultType": "complete",
    "description": "Code review prompt",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Please review this Python code:\ndef hello():\n    print('world')"
        }
      }
    ]
  }
}
```

Servers **MAY** also respond to `prompts/get` with an [`InputRequiredResult`](/specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult) to indicate that additional input is needed before the prompt can be resolved. This follows the [multi round-trip requests](/specification/2026-07-28/basic/patterns/mrtr#multi-round-trip-requests) mechanism. When retrying the request, clients include `inputResponses` and, if provided by the server, `requestState` in the request parameters.
