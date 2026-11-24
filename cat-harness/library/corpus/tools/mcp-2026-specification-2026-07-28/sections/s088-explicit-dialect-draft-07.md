---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s088-explicit-dialect-draft-07
section_title: "Explicit dialect (draft-07):"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 275-288
source_sha256: 03586b10e3214c55
granularity: heading
---
#### Explicit dialect (draft-07):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}
```
