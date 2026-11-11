---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s494-tool-with-explicit-draft-07-schema
section_title: "Tool with explicit draft-07 schema:"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 652-669
source_sha256: ed550806a58eb774
granularity: heading
---
#### Tool with explicit draft-07 schema:

```json
{
  "name": "calculate_sum",
  "description": "Add two numbers",
  "inputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "a": { "type": "number" },
      "b": { "type": "number" }
    },
    "required": ["a", "b"]
  }
}
```
