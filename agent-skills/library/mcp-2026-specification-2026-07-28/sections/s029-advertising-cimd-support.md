---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s029-advertising-cimd-support
section_title: "Advertising CIMD Support"
file: "docs/specification/2026-07-28/basic/authorization/client-registration.mdx"
lines: 114-127
source_sha256: 912365f0c2b85926
granularity: heading
---
### Advertising CIMD Support

Authorization servers advertise that they support clients using Client ID Metadata Documents by including the following property in their OAuth Authorization Server metadata:

```json
{
  "client_id_metadata_document_supported": true
}
```

MCP clients **SHOULD** check for this capability and **MAY** fall back to
[Dynamic Client Registration](#dynamic-client-registration)
or [pre-registration](#pre-registration) if unavailable.
