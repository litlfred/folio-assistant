---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s137-custom-transports
section_title: "Custom Transports"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 60-80
source_sha256: 59cc01897f5efadc
granularity: heading
---
## Custom Transports

Clients and servers **MAY** implement additional custom transport mechanisms
to suit their specific needs. The protocol is transport-agnostic and can be
implemented over any communication channel that supports bidirectional
message exchange.

Implementers who choose to support custom transports **MUST** preserve the
JSON-RPC message format, the
[message patterns](/specification/2026-07-28/basic/patterns), and the per-request
metadata model. Custom transports **SHOULD** document their connection
establishment, message framing, and cancellation patterns to aid
interoperability.

Custom transports that run over a reliable bidirectional byte stream (e.g.,
Unix domain sockets or TCP) **SHOULD** reuse the
[stdio framing](/specification/2026-07-28/basic/transports/stdio) rather than
defining a new one: the stdio binding is just newline-delimited JSON-RPC
over a byte stream, and only its process-lifecycle rules are specific to
standard streams.
