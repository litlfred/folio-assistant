---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s515-reference-types
section_title: "Reference Types"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 133-141
source_sha256: 1965c563aadb99e1
granularity: heading
---
### Reference Types

The protocol supports two types of completion references:

| Type           | Description                               | Example                                             |
| -------------- | ----------------------------------------- | --------------------------------------------------- |
| `ref/prompt`   | References a prompt by name               | `{"type": "ref/prompt", "name": "code_review"}`     |
| `ref/resource` | References a resource URI or URI template | `{"type": "ref/resource", "uri": "file:///{path}"}` |
