---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s209-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 38-52
source_sha256: 016aea34d76ccce8
granularity: heading
---
## Capabilities

Clients that support roots **MUST** declare the `roots` capability in
`_meta.io.modelcontextprotocol/clientCapabilities` on each request:

```json
{
  "_meta": {
    "io.modelcontextprotocol/clientCapabilities": {
      "roots": {}
    }
  }
}
```
