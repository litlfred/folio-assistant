---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s138-backward-compatibility
section_title: "Backward Compatibility"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 81-89
source_sha256: 59cc01897f5efadc
granularity: heading
---
## Backward Compatibility

Earlier protocol revisions established a connection-scoped session with an
`initialize` handshake and allowed servers to initiate JSON-RPC requests.
Clients and servers that interoperate with those revisions detect the
counterpart's era and fall back as described in
[Versioning: Backward Compatibility](/specification/2026-07-28/basic/versioning#backward-compatibility-with-initialization-based-versions),
which includes a compatibility matrix for implementors. Each binding page
describes its transport-specific detection mechanics.
