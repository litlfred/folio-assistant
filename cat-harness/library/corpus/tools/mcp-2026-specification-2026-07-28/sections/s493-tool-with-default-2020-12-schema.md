---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s493-tool-with-default-2020-12-schema
section_title: "Tool with default 2020-12 schema:"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 635-651
source_sha256: ed550806a58eb774
granularity: heading
---
#### Tool with default 2020-12 schema:

```json
{
  "name": "calculate_sum",
  "description": "Add two numbers",
  "inputSchema": {
    "type": "object",
    "properties": {
      "a": { "type": "number" },
      "b": { "type": "number" }
    },
    "required": ["a", "b"]
  }
}
```
