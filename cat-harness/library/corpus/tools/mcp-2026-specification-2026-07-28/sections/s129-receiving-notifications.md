---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s129-receiving-notifications
section_title: "Receiving Notifications"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 83-106
source_sha256: 8333cbc3280cad29
granularity: heading
---
## Receiving Notifications

All notifications delivered on the stream carry
`io.modelcontextprotocol/subscriptionId` in `_meta`, identifying the
`subscriptions/listen` request that opened the stream. The value is the JSON-RPC ID of
the `subscriptions/listen` request. In the examples above, the request used `"id": 1`,
so the acknowledgment and all subsequent notifications carry the subscription ID `1`.
On stdio, where all messages
share a single channel, clients **MUST** use this field to correlate notifications
with their originating subscription.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 1
    },
    "uri": "file:///project/config.json"
  }
}
```
