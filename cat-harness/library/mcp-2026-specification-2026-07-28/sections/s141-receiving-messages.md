---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s141-receiving-messages
section_title: "Receiving Messages"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 39-64
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Receiving Messages

The client reads server messages from `stdout`, one message per line. All
messages share this single channel; there are no per-request streams.

The server writes three kinds of messages:

1. _Responses_ to client requests, correlated by JSON-RPC `id`.
2. _Notifications_ that relate to an in-flight request, such as
   `notifications/progress` and `notifications/message`.
3. _Notifications_ delivered for an active
   [`subscriptions/listen`][subscriptions-listen] request. Clients **MUST**
   correlate these using the `io.modelcontextprotocol/subscriptionId` field
   in `_meta`; see
   [`SubscriptionsListenRequest`][subscriptions-listen-request].

The server **MUST NOT** write JSON-RPC _requests_ to `stdout`.
Server-to-client interactions are carried in
[`InputRequiredResult`][mrtr-input-required] replies; see
[Multi Round-Trip Requests][mrtr].

[mrtr]: /specification/2026-07-28/basic/patterns/mrtr
[mrtr-input-required]: /specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult
[subscriptions-listen]: /specification/2026-07-28/basic/patterns/subscriptions
[subscriptions-listen-request]: /specification/2026-07-28/schema#subscriptionslistenrequest
