---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s149-sending-messages
section_title: "Sending Messages"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 70-106
source_sha256: 22574bf11e004068
granularity: heading
---
## Sending Messages

Every JSON-RPC message sent from the client **MUST** be a new HTTP POST
request to the MCP endpoint.

1. The client **MUST** use HTTP POST to send JSON-RPC messages.
2. The client **MUST** include an `Accept` header listing both
   `application/json` and `text/event-stream` as supported content types.
3. The client **MUST** include the [request metadata headers](#request-metadata)
   on each POST request.
4. The body of the HTTP POST **MUST** be a single JSON-RPC _request_ or
   _notification_. The client **MUST NOT** send JSON-RPC _responses_.
5. If the body is a JSON-RPC _notification_:
   - If the server accepts it, the server **MUST** return HTTP status code
     `202 Accepted` with no body.
   - If the server cannot accept it, it **MUST** return an HTTP error status
     code (e.g., `400 Bad Request`). The HTTP response body **MAY** comprise
     a JSON-RPC _error response_ that has no `id`.
6. If the body is a JSON-RPC _request_, the server **MUST** return either
   `Content-Type: application/json` (a single JSON object) or
   `Content-Type: text/event-stream` (an SSE response stream). The client
   **MUST** support both.

<Note>

This revision of the core protocol defines no client-to-server
_notifications_ over Streamable HTTP. The only client-sent notification in
the core protocol, `notifications/cancelled`, is used only on the
[stdio](/specification/2026-07-28/basic/transports/stdio) transport; on
Streamable HTTP, closing the SSE response stream is itself the cancellation
signal and no `notifications/cancelled` message is expected (see
[Cancellation][cancellation]). The notification rules above describe the
transport mechanics for a notification POST; header requirements for
notification POSTs are not defined by this revision.

</Note>
