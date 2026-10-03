---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s512-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 33-44
source_sha256: 1965c563aadb99e1
granularity: heading
---
## Capabilities

Servers that support completions **MUST** declare the `completions` capability:

```json
{
  "capabilities": {
    "completions": {}
  }
}
```
