---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s456-subscriptions
section_title: "Subscriptions"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 244-268
source_sha256: 10538119019af5f4
granularity: heading
---
### Subscriptions

Clients subscribe to change notifications for specific resources by sending a
[`subscriptions/listen`][subscriptions-listen] request with the resource URIs listed in
`notifications.resourceSubscriptions`. The server delivers
`notifications/resources/updated` on the resulting stream whenever a watched resource
changes.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": { "io.modelcontextprotocol/subscriptionId": 4 },
    "uri": "file:///project/src/main.rs"
  }
}
```

See [Subscriptions][subscriptions] for the full protocol mechanics (acknowledgment,
`subscriptionId` correlation, and cancellation).

[subscriptions-listen]: /specification/2026-07-28/schema#subscriptionslistenrequest
[subscriptions]: /specification/2026-07-28/basic/patterns/subscriptions
