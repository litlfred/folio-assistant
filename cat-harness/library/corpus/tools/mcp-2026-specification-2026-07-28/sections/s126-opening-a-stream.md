---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s126-opening-a-stream
section_title: "Opening a Stream"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 12-39
source_sha256: 8333cbc3280cad29
granularity: heading
---
## Opening a Stream

The client sends a `subscriptions/listen` request with a `notifications` filter
specifying which event types it wants to receive. The server **MUST NOT** send
notification types the client has not explicitly requested.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "ExampleClient",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    },
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["file:///project/config.json"]
    }
  }
}
```
