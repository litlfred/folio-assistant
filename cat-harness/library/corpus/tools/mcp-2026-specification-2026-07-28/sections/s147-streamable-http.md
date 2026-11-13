---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s147-streamable-http
section_title: "Streamable HTTP"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 1-53
source_sha256: 22574bf11e004068
granularity: heading
---
---
title: Streamable HTTP
---

<div id="enable-section-numbers" />

<Info>

Streamable HTTP was introduced in protocol version 2025-03-26 as a replacement
for the [HTTP+SSE transport][http-sse] from protocol version 2024-11-05.

</Info>

<Info>

Revision 2026-07-28 changed the behavior of Streamable HTTP. Clients must
ensure they handle backwards compatibility correctly. Changes included:

- Removal of the GET stream endpoint.
- Removal of protocol-level sessions.

See the [changelog](/specification/2026-07-28/changelog) and
[Backward Compatibility](#backward-compatibility) below.

</Info>

In the **Streamable HTTP** transport, the server operates as an independent
process that can handle multiple client connections. At a glance:

- The server exposes a single HTTP endpoint (the **MCP endpoint**) that
  accepts POST.
- The client sends every JSON-RPC request or notification as its own HTTP
  POST.
- The server answers each request with either a single JSON object or a
  [Server-Sent Events][sse] (SSE) stream scoped to that request, carrying
  request-related notifications followed by the final response.
- Server-to-client interactions (sampling, elicitation, roots) are embedded
  in results as input requests per
  [Multi Round-Trip Requests (MRTR)][mrtr] ([SEP-2322][sep-2322]).
- Long-lived change notifications (such as list changes and resource updates)
  are delivered on the response stream of a
  [`subscriptions/listen`][subscriptions-listen] request.

See [Message Flow](#message-flow) for sequence diagrams of these
interactions.

The server **MUST** provide a single HTTP endpoint path (hereafter referred to
as the **MCP endpoint**) that supports POST. For example, this could be a URL
like `https://example.com/mcp`.

[http-sse]: /specification/2024-11-05/basic/transports#http-with-sse
[sse]: https://en.wikipedia.org/wiki/Server-sent_events
