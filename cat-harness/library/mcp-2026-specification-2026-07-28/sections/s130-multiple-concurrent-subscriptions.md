---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s130-multiple-concurrent-subscriptions
section_title: "Multiple Concurrent Subscriptions"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 107-115
source_sha256: 8333cbc3280cad29
granularity: heading
---
## Multiple Concurrent Subscriptions

A client **MAY** have multiple active subscriptions concurrently — for example,
one listening for tools-list changes and another for resource updates. Each
subscription is identified by the JSON-RPC request ID of its
`subscriptions/listen` request, and every notification on the stream carries
that ID in
`io.modelcontextprotocol/subscriptionId` so clients can demultiplex them.
