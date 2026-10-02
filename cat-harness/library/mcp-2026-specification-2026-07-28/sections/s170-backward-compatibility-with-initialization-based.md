---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s170-backward-compatibility-with-initialization-based
section_title: "Backward Compatibility with Initialization-Based Versions"
file: "docs/specification/2026-07-28/basic/versioning.mdx"
lines: 126-158
source_sha256: bc02f271700bdecd
granularity: heading
---
## Backward Compatibility with Initialization-Based Versions

A server that wishes to support both [legacy](#terminology) clients (which
expect an `initialize` handshake) and [modern](#terminology) clients (which
use per-request metadata) **MAY** implement both behaviors.

A client that needs to interoperate with both kinds of servers detects the
server's era with transport-specific mechanics, specified in the binding
pages:

- [stdio](/specification/2026-07-28/basic/transports/stdio#backward-compatibility):
  probe with `server/discover` and fall back on any error that is not a
  recognized modern error.
- [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http#backward-compatibility):
  attempt a modern request and inspect the body of a `400 Bad Request`
  before falling back.

In both cases, a recognized modern JSON-RPC error (such as
[`UnsupportedProtocolVersionError`](/specification/2026-07-28/schema#unsupportedprotocolversionerror))
identifies a modern server: the client retries with a supported version
rather than falling back. Anything else identifies a legacy server.

The era determination is a property of the server, not of an individual
request. Clients **SHOULD** cache the result for the lifetime of the server
process (stdio) or origin (HTTP), and **MAY** persist it across restarts of
the same server configuration, re-probing if the cached assumption later
fails.

A server that supports only [modern](#terminology) versions **SHOULD** name
the protocol versions it supports in any error it returns to an `initialize`
request, on any transport: legacy clients have no fall-forward mechanism, and
this message may be the only diagnostic they can surface to users.
