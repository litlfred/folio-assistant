---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s153-request-metadata
section_title: "Request Metadata"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 244-249
source_sha256: 22574bf11e004068
granularity: heading
---
## Request Metadata

The Streamable HTTP transport mirrors selected JSON-RPC body fields into HTTP
headers so that intermediaries (load balancers, gateways, observability
tooling) can route and inspect requests without parsing the body.
