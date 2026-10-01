---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s099-timeouts
section_title: "Timeouts"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 45-65
source_sha256: 396030784a4af9b7
granularity: heading
---
## Timeouts

Implementations **SHOULD** establish timeouts for all sent requests, to prevent hung
connections and resource exhaustion. When the request has not received a success or error
response within the timeout period, the sender **SHOULD** cancel the request and stop
waiting for a response. As described in
[Transport-Specific Cancellation](#transport-specific-cancellation), this means:

- **Streamable HTTP**: closing the response stream for the request, which constitutes
  cancellation.
- **stdio**: sending a `notifications/cancelled` notification referencing the request ID.

SDKs and other middleware **SHOULD** allow these timeouts to be configured on a
per-request basis.

Implementations **MAY** choose to reset the timeout clock when receiving a
[progress notification](/specification/2026-07-28/basic/patterns/progress) corresponding to
the request, as this implies that work is actually happening. However, implementations
**SHOULD** always enforce a maximum timeout, regardless of progress notifications, to
limit the impact of a misbehaving client or server.
