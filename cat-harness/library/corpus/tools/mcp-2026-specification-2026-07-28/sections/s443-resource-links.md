---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s443-resource-links
section_title: "Resource Links"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 274-293
source_sha256: 85e550635bbbbaa9
granularity: heading
---
#### Resource Links

Prompt messages **MAY** include links to
[Resources](/specification/2026-07-28/server/resources), to provide additional context or
data without embedding the resource contents directly. In this case, the prompt message
returns a URI that can be fetched by the client:

```json
{
  "type": "resource_link",
  "uri": "file:///project/src/main.rs",
  "name": "main.rs",
  "description": "Primary application entry point",
  "mimeType": "text/x-rust"
}
```

Resource links support the same [Resource annotations](/specification/2026-07-28/server/resources#annotations)
as regular resources to help clients understand how to use them.
