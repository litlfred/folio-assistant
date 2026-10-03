---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s128-acknowledgment
section_title: "Acknowledgment"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 52-82
source_sha256: 8333cbc3280cad29
granularity: heading
---
## Acknowledgment

The server **MUST** send `notifications/subscriptions/acknowledged` as the first message
carrying the subscription's ID in `_meta` under `io.modelcontextprotocol/subscriptionId`,
and **MUST NOT** send any notification on the
subscription before it. On stdio, where every subscription shares one channel, this
ordering is defined per subscription ID and not per channel: messages belonging to other
subscriptions **MAY** be interleaved before it.

The `notifications` field in the acknowledgment reflects the subset the server agreed to
honor. Notification types the server does not support are omitted.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 1
    },
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["file:///project/config.json"]
    }
  }
}
```

The client **SHOULD** check the acknowledged filter against what it requested and handle
any unsupported types gracefully.
