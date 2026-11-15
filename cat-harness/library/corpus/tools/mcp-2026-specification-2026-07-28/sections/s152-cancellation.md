---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s152-cancellation
section_title: "Cancellation"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 233-243
source_sha256: 22574bf11e004068
granularity: heading
---
## Cancellation

Closing the SSE response stream **MUST** be treated by the server as
cancellation of that request. Because each request has its own response
stream, the transport-level disconnect is unambiguous. The server **SHOULD**
stop work on the cancelled request as soon as practical and **MUST NOT** send
any further messages for it. See
[Cancellation][cancellation] for the full rules.

[cancellation]: /specification/2026-07-28/basic/patterns/cancellation
