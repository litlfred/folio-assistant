---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s168-protocol-version-negotiation
section_title: "Protocol Version Negotiation"
file: "docs/specification/2026-07-28/basic/versioning.mdx"
lines: 41-79
source_sha256: bc02f271700bdecd
granularity: heading
---
## Protocol Version Negotiation

Every request declares the protocol version it is using in its
[`_meta`](/specification/2026-07-28/basic/index#meta) field. On HTTP, this is
also carried in the
[`MCP-Protocol-Version` header](/specification/2026-07-28/basic/transports/streamable-http#protocol-version-header).

If the server does not implement the requested version (whether the version
is unknown to the server, or is a known version the server has chosen not to
support), it **MUST** respond with an
[`UnsupportedProtocolVersionError`](/specification/2026-07-28/schema#unsupportedprotocolversionerror)
listing the versions it does support:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32022,
    "message": "Unsupported protocol version",
    "data": {
      "supported": ["2026-07-28", "2025-11-25"],
      "requested": "1900-01-01"
    }
  }
}
```

The client **SHOULD** select a mutually supported version from the `supported`
list and retry the request, or surface an error to the user if no compatible
version exists.

Servers **MUST** implement
[`server/discover`](/specification/2026-07-28/server/discover). Clients
**MAY** call it before sending any other requests to learn the server's
supported versions up front, but are not required to: a client is free to
invoke any RPC inline and handle `UnsupportedProtocolVersionError` if its
preferred version is not supported.
