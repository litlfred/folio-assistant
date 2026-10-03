---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s425-when-to-call
section_title: "When to Call"
file: "docs/specification/2026-07-28/server/discover.mdx"
lines: 62-87
source_sha256: 3fe1f5b5f1528014
granularity: heading
---
## When to Call

Calling `server/discover` is optional for clients — a client may invoke any
RPC inline and handle
[`UnsupportedProtocolVersionError`](/specification/2026-07-28/schema#unsupportedprotocolversionerror)
if the server does not support the requested version. However, `server/discover`
is useful in two scenarios:

- **Presenting server information.** While a client doesn't need to call
  `server/discover` to use the server, it's a convenient way to retrieve the
  server's identity, capabilities, and supported versions in a single request.
  For example, a client can present the capabilities a server supports from a
  single `server/discover` response instead of probing with separate
  `tools/list`, `prompts/list`, and `resources/list` requests.
- **stdio backward-compatibility probe.** On stdio, there is no per-request
  HTTP status code to drive fallback. A client that supports both modern
  (per-request `_meta`) and legacy (`initialize` handshake) servers **SHOULD**
  send `server/discover` first; see
  [stdio: Backward Compatibility](/specification/2026-07-28/basic/transports/stdio#backward-compatibility)
  for the fallback rules.

See [Protocol Version Negotiation](/specification/2026-07-28/basic/versioning#protocol-version-negotiation)
for the full version-selection flow. For HTTP-specific status codes returned for
unknown methods, see the [Protocol Version Header](/specification/2026-07-28/basic/transports/streamable-http#protocol-version-header)
section in Transports.
