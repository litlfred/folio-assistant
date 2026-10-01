---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s132-graceful-closure
section_title: "Graceful Closure"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 128-166
source_sha256: 8333cbc3280cad29
granularity: heading
---
### Graceful Closure

When the server ends a subscription on its own initiative (for example, during
shutdown), it **SHOULD** respond to the original `subscriptions/listen` request
with a completion result before closing the stream. The result carries no
method-specific data beyond the standard result fields and subscription
metadata. This is the JSON-RPC response to the long-lived request, correlated by
its `id`, and signals that the subscription ended gracefully — as opposed to an
abrupt transport drop, which carries no response.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 1
    }
  }
}
```

Like every other message on the stream, the response carries
`io.modelcontextprotocol/subscriptionId` in `_meta`, identifying which
subscription it closes. The value matches the JSON-RPC `id` of the originating
`subscriptions/listen` request.

A client that receives this response knows the subscription closed cleanly; a
transport that closes without it indicates an unexpected disconnect, which the
client **MAY** treat as a trigger to reconnect.

On **stdio**, if the connection is terminated and then re-established, the
client **MUST** re-send `subscriptions/listen` to re-establish its
subscriptions — the server holds no subscription state across reconnections.

See [Cancellation][cancellation] for the full rules.

[cancellation]: /specification/2026-07-28/basic/patterns/cancellation
