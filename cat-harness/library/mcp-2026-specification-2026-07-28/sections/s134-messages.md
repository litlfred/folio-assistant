---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s134-messages
section_title: "Messages"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 27-37
source_sha256: 59cc01897f5efadc
granularity: heading
---
## Messages

MCP uses JSON-RPC to encode messages. JSON-RPC messages **MUST** be UTF-8
encoded.

A binding **MUST** deliver client-sent _requests_ and _notifications_ to the
server, and server-sent _responses_ and _notifications_ to the client. No
other message direction exists: per the
[message patterns](/specification/2026-07-28/basic/patterns), servers do not
initiate JSON-RPC requests and clients do not send JSON-RPC responses.
