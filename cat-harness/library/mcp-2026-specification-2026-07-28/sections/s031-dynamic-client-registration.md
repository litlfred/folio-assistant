---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s031-dynamic-client-registration
section_title: "Dynamic Client Registration"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 138-151
source_sha256: 912365f0c2b85926
granularity: heading
---
## Dynamic Client Registration

<Warning>
  Dynamic Client Registration is deprecated. New implementations should use
  [Client ID Metadata Documents](#client-id-metadata-documents) instead. This
  option remains available for backwards compatibility with authorization
  servers that do not support Client ID Metadata Documents.
</Warning>

MCP clients and authorization servers **MAY** support the
OAuth 2.0 Dynamic Client Registration Protocol [RFC7591](https://datatracker.ietf.org/doc/html/rfc7591)
to allow MCP clients to obtain OAuth client IDs without user interaction.
This option is included for backwards compatibility with earlier versions of the MCP authorization spec.
