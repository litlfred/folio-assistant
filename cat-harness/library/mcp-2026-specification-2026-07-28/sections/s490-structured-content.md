---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s490-structured-content
section_title: "Structured Content"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 496-508
source_sha256: ed550806a58eb774
granularity: heading
---
#### Structured Content

**Structured** content is returned as a JSON value in the `structuredContent` field of a result. This can be any JSON value (object, array, string, number, boolean, or null) that conforms to the tool's `outputSchema` if one is defined.

For backwards compatibility, a tool that returns structured content SHOULD also return the serialized JSON in a TextContent block.

<Note>

`structuredContent` is server-produced result data and is unrelated to LLM
"structured outputs" (schema-constrained model generation).

</Note>
