---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s136-cancellation
section_title: "Cancellation"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 52-59
source_sha256: 59cc01897f5efadc
granularity: heading
---
## Cancellation

Each binding defines how a client abandons an in-flight request: on stdio
the client sends a `notifications/cancelled` notification; on Streamable
HTTP it closes the request's response stream. The protocol-level rules are
the same everywhere; see
[Cancellation](/specification/2026-07-28/basic/patterns/cancellation).
