---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s085-schema-dialect
section_title: "Schema Dialect"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 251-259
source_sha256: 03586b10e3214c55
granularity: heading
---
### Schema Dialect

MCP supports JSON Schema with the following rules:

1. **Default dialect**: When a schema does not include a `$schema` field, it defaults to [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/schema)
1. **Explicit dialect**: Schemas MAY include a `$schema` field to specify a different dialect
1. **Supported dialects**: Implementations MUST support at least 2020-12 and SHOULD document which additional dialects they support
1. **Recommendation**: Implementors are RECOMMENDED to use JSON Schema 2020-12.
