---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s519-completerequest
section_title: "CompleteRequest"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 168-177
source_sha256: 1965c563aadb99e1
granularity: heading
---
### CompleteRequest

- `ref`: A `PromptReference` or `ResourceTemplateReference`. For
  `ResourceTemplateReference`, `uri` is a URI or URI template.
- `argument`: Object containing:
  - `name`: Argument name
  - `value`: Current value
- `context`: Object containing:
  - `arguments`: A mapping of already-resolved argument names to their values.
