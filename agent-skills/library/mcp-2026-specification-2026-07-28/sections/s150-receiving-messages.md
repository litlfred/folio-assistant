---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s150-receiving-messages
section_title: "Receiving Messages"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 107-165
source_sha256: 22574bf11e004068
granularity: heading
---
## Receiving Messages

When the server returns an SSE response stream
(`Content-Type: text/event-stream`):

- The server **MAY** send JSON-RPC _notifications_ — for example,
  [`notifications/progress`][notifications-progress]
  or [`notifications/message`][notifications-message] —
  before the final response. These notifications **MUST** relate to the
  originating client request.
- The server **MUST NOT** send independent JSON-RPC _requests_ on this stream.
  Server-to-client interactions (sampling, elicitation, list-roots) are
  embedded as input requests inside an
  [`InputRequiredResult`][input-required-result] per
  [MRTR][mrtr] ([SEP-2322][sep-2322]), not delivered as separate requests on
  this or any other stream. This is a change from Streamable HTTP in protocol
  versions `2025-03-26` through `2025-11-25`, where servers could send such
  requests on SSE streams.
- The final JSON-RPC _response_ **SHOULD** terminate the stream.

Long-lived notification streams are obtained by sending a
[`subscriptions/listen`][subscriptions-listen]
request. The server's response is itself an SSE stream that stays open and
delivers the change notifications the client opted in to (such as
`notifications/tools/list_changed` or `notifications/resources/updated`).
Request-scoped notifications like `notifications/progress` and
`notifications/message` are **not** delivered on the listen stream — they
flow only on the response stream of the request they relate to.

When initiating an SSE stream, servers **SHOULD** include the
`X-Accel-Buffering: no` header in the HTTP response. This instructs reverse
proxies (such as nginx) to disable response buffering, ensuring that SSE
events are delivered to clients immediately rather than being held in a
buffer. Without this header, proxies may accumulate messages before sending
them to the client, introducing unwanted latency and potentially breaking the
real-time nature of SSE communication.

<Note>

For long-lived streams — in particular the
[`subscriptions/listen`][subscriptions-listen] response stream — servers are
encouraged to periodically emit an SSE comment line (a line beginning with a
colon, e.g. `:\r\n`) as a keep-alive. This keeps the connection from being
closed by intermediaries or client idle timeouts during quiet periods when no
notifications are flowing. Per the [SSE specification][sse], any line beginning
with a colon is a comment that carries no event data; clients must ignore such
lines and must not treat them as malformed input.

</Note>

Resumable SSE streams via `Last-Event-ID` are not supported.

[notifications-progress]: /specification/2026-07-28/basic/patterns/progress
[notifications-message]: /specification/2026-07-28/server/utilities/logging
[input-required-result]: /specification/2026-07-28/schema#inputrequiredresult
[mrtr]: /specification/2026-07-28/basic/patterns/mrtr
[sep-2322]: /seps/2322-MRTR
[subscriptions-listen]: /specification/2026-07-28/basic/patterns/subscriptions
