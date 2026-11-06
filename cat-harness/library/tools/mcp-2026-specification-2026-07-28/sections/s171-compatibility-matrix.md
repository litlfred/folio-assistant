---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s171-compatibility-matrix
section_title: "Compatibility Matrix"
file: "docs/specification/2026-07-28/basic/versioning.mdx"
lines: 159-183
source_sha256: bc02f271700bdecd
granularity: heading
---
### Compatibility Matrix

The following matrix summarizes the expected outcome of every combination of
client and server era:

| Client   | Server   | Outcome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modern   | Modern   | Works. `server/discover` is optional; version mismatches surface as `UnsupportedProtocolVersionError` and the client retries with a mutually supported version.                                                                                                                                                                                                                                                                                                                                                                             |
| Modern   | Legacy   | Fails. The server may reject the request with an implementation-defined error, stay silent, or even process an era-ambiguous method under legacy semantics. On stdio, clients **SHOULD** send `server/discover` first to fail deterministically; the client then surfaces an actionable error to the user.                                                                                                                                                                                                                                  |
| Dual-era | Modern   | Works. The stdio probe returns a `DiscoverResult` (or `UnsupportedProtocolVersionError`); on HTTP, the first modern request succeeds or returns a modern error. The client stays modern.                                                                                                                                                                                                                                                                                                                                                    |
| Dual-era | Legacy   | Works. stdio: the probe returns a non-modern error or times out, and the client falls back to `initialize`. HTTP: the modern request returns a `4xx` without a recognized modern error body, and the client falls back to `initialize` (and possibly further to the deprecated HTTP+SSE transport).                                                                                                                                                                                                                                         |
| Legacy   | Modern   | Fails. stdio: the server rejects `initialize` with a JSON-RPC error; the exact code is implementation-defined (`initialize` is an unknown method and the request also lacks the required `_meta` fields). HTTP: the request is missing the required headers and is rejected per [server validation](/specification/2026-07-28/basic/transports/streamable-http#server-validation) with `400 Bad Request` (a client on the deprecated HTTP+SSE transport fails at its opening `GET` instead). Legacy clients have no fall-forward mechanism. |
| Legacy   | Dual-era | Works. The server answers `initialize` and serves the client according to the negotiated legacy revision.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Legacy   | Legacy   | Works according to the legacy revision; out of scope for this document.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

A dual-era **server** selects its behavior from how the client opens:

- A request carrying modern per-request `_meta` is served statelessly
  according to this revision.
- An `initialize` request selects legacy semantics, scoped to the stdio
  process (stdio) or the session (HTTP), as specified by the negotiated
  legacy protocol version.

A dual-era server **MAY** serve both eras concurrently on the same endpoint
or process.
