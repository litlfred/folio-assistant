---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s098-transport-specific-cancellation
section_title: "Transport-Specific Cancellation"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 35-44
source_sha256: 396030784a4af9b7
granularity: heading
---
## Transport-Specific Cancellation

How a client signals cancellation depends on the transport:

- **Streamable HTTP**: Closing the SSE response stream is the cancellation signal.
  The server **MUST** treat a client disconnect as cancellation of that request. No
  `notifications/cancelled` message is required or expected.
- **stdio**: There is no per-request stream to close. The client **MUST** send a
  `notifications/cancelled` notification referencing the request ID.
