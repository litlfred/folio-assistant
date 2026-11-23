---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s488-resource-links
section_title: "Resource Links"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 451-472
source_sha256: ed550806a58eb774
granularity: heading
---
#### Resource Links

A tool **MAY** return links to [Resources](/specification/2026-07-28/server/resources), to provide additional context
or data. In this case, the tool will return a URI that can be subscribed to or fetched by the client:

```json
{
  "type": "resource_link",
  "uri": "file:///project/src/main.rs",
  "name": "main.rs",
  "description": "Primary application entry point",
  "mimeType": "text/x-rust"
}
```

Resource links support the same [Resource annotations](/specification/2026-07-28/server/resources#annotations) as regular resources to help clients understand how to use them.

<Info>
  Resource links returned by tools are not guaranteed to appear in the results
  of a `resources/list` request.
</Info>
