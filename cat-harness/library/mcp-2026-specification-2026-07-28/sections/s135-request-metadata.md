---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s135-request-metadata
section_title: "Request Metadata"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 38-51
source_sha256: 59cc01897f5efadc
granularity: heading
---
## Request Metadata

All protocol metadata travels in the message body: every request carries its
protocol version and client capabilities in
[`_meta.io.modelcontextprotocol/*`](/specification/2026-07-28/basic/index#meta)
fields.

A binding **MAY** additionally mirror selected body fields into envelope
metadata. The Streamable HTTP transport mirrors them into
[HTTP headers](/specification/2026-07-28/basic/transports/streamable-http#request-metadata)
so that intermediaries can route and inspect requests without parsing the
body. The body remains the source of truth; bindings that mirror metadata
define how mismatches are rejected.
