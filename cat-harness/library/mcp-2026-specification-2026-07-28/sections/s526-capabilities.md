---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s526-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 30-41
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
## Capabilities

Servers that emit log message notifications **MUST** declare the `logging` capability:

```json
{
  "capabilities": {
    "logging": {}
  }
}
```
