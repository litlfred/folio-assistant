---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s140-sending-messages
section_title: "Sending Messages"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 33-38
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Sending Messages

The client sends messages by writing JSON-RPC _requests_ and _notifications_
to the server's `stdin`, one message per line. The client **MUST NOT** write
JSON-RPC _responses_.
