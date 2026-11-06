---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s131-cancellation
section_title: "Cancellation"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 116-127
source_sha256: 8333cbc3280cad29
granularity: heading
---
## Cancellation

A subscription ends when:

- The **client** cancels it — close the SSE stream (HTTP) or send
  `notifications/cancelled` referencing the `subscriptions/listen` request ID (stdio).
- The **server** tears it down (e.g., during shutdown) — it **SHOULD** send a
  successful `subscriptions/listen` response to signal a graceful end (see
  [Graceful Closure](#graceful-closure)), then close the stream.
- The underlying transport closes (HTTP timeout, TCP disconnect, stdio process
  exit).
