---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s164-earlier-streamable-http-revisions
section_title: "Earlier Streamable HTTP Revisions"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 670-694
source_sha256: 22574bf11e004068
granularity: heading
---
### Earlier Streamable HTTP Revisions

Protocol versions `2025-03-26` through [`2025-11-25`](/specification/2025-11-25/basic/transports)
also used the Streamable HTTP transport, but in a different shape: servers could assign a session via
the `Mcp-Session-Id` header (terminated with HTTP DELETE), clients could open
a standalone SSE stream with HTTP GET to receive server-initiated messages,
servers could send JSON-RPC _requests_ on SSE streams, and streams were
resumable via `Last-Event-ID`. None of these mechanisms are part of this
revision.

A server that supports only this revision and receives such traffic from an
older client **SHOULD** respond as follows:

- HTTP GET or DELETE to the MCP endpoint: respond with
  `405 Method Not Allowed`.
- An `Mcp-Session-Id` header on a request: ignore it, and do not mint or echo
  session IDs.
- A `Last-Event-ID` header: ignore it; streams are not resumable.

Servers and clients that need to interoperate with counterparts speaking
those protocol versions implement the behavior described in the corresponding
revision (for example,
[2025-11-25: Streamable HTTP](/specification/2025-11-25/basic/transports#streamable-http)),
in addition to the version-negotiation fallback described above.
