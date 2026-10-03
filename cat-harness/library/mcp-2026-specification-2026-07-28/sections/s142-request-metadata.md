---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s142-request-metadata
section_title: "Request Metadata"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 65-75
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Request Metadata

All request metadata for the stdio transport is carried inline in the
JSON-RPC message body. The protocol version, per-request capabilities, and
optional client identity live in
[`_meta.io.modelcontextprotocol/*`][meta-fields];
the method name and arguments live where JSON-RPC puts them. There is no
header layer.

[meta-fields]: /specification/2026-07-28/basic/index#meta
