---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s080-message-patterns
section_title: "Message Patterns"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 174-181
source_sha256: 03586b10e3214c55
granularity: heading
---
### Message Patterns

The Model Context Protocol (MCP) supports several [Message Patterns](/specification/2026-07-28/basic/patterns) that define how clients and servers interact:

1. **[Request and Response](/specification/2026-07-28/basic/patterns#request-and-response)**: A client sends a request to the server, and the server responds with a result or error.
2. **[Multi Round-Trip Requests (MRTR)](/specification/2026-07-28/basic/patterns#multi-round-trip-requests)**: A server requires additional client input (sampling, elicitation, or roots) to complete a request.
3. **[Subscribe and Notify](/specification/2026-07-28/basic/patterns#subscribe-and-notify)**: A client subscribes to a stream of notifications from the server, which are sent as they occur.
