---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s087-default-dialect-2020-12
section_title: "Default dialect (2020-12):"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 262-274
source_sha256: 03586b10e3214c55
granularity: heading
---
#### Default dialect (2020-12):

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}
```
