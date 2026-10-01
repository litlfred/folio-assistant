---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s489-embedded-resources
section_title: "Embedded Resources"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 473-495
source_sha256: ed550806a58eb774
granularity: heading
---
#### Embedded Resources

[Resources](/specification/2026-07-28/server/resources) **MAY** be embedded to provide additional context
or data using a suitable [URI scheme](./resources#common-uri-schemes). Servers that use embedded resources **SHOULD** implement the `resources` capability:

```json
{
  "type": "resource",
  "resource": {
    "uri": "file:///project/src/main.rs",
    "mimeType": "text/x-rust",
    "text": "fn main() {\n    println!(\"Hello world!\");\n}",
    "annotations": {
      "audience": ["user", "assistant"],
      "priority": 0.7,
      "lastModified": "2025-05-03T14:30:00Z"
    }
  }
}
```

Embedded resources support the same [Resource annotations](/specification/2026-07-28/server/resources#annotations) as regular resources to help clients understand how to use them.
