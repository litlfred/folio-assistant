---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s097-cancellation-flow
section_title: "Cancellation Flow"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 16-34
source_sha256: 396030784a4af9b7
granularity: heading
---
## Cancellation Flow

When a client wants to cancel an in-progress request, it sends a `notifications/cancelled`
notification containing:

- The ID of the request to cancel
- An optional reason string that can be logged or displayed

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": "123",
    "reason": "User requested cancellation"
  }
}
```
