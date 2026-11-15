---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s481-tool
section_title: "Tool"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 282-308
source_sha256: ed550806a58eb774
granularity: heading
---
### Tool

A tool definition includes:

- `name`: Unique identifier for the tool
- `title`: Optional human-readable name of the tool for display purposes.
- `description`: Human-readable description of functionality
- `icons`: Optional array of icons for display in user interfaces
- `inputSchema`: JSON Schema defining expected parameters
  - Follows the [JSON Schema usage guidelines](/specification/2026-07-28/basic#json-schema-usage)
  - Defaults to 2020-12 if no `$schema` field is present
  - **MUST** be a valid JSON Schema object (not `null`)
  - For tools with no parameters, use one of these valid approaches:
    - `{ "type": "object", "additionalProperties": false }` - **Recommended**: explicitly accepts only empty objects
    - `{ "type": "object" }` - accepts any object (including with properties)
  - Properties **MAY** include an [`x-mcp-header`](#x-mcp-header) annotation to expose
    parameter values as HTTP headers
- `outputSchema`: Optional JSON Schema defining expected output structure
  - Follows the [JSON Schema usage guidelines](/specification/2026-07-28/basic#json-schema-usage)
  - Defaults to 2020-12 if no `$schema` field is present
- `annotations`: Optional properties describing tool behavior

<Warning>
  For trust & safety and security, clients **MUST** consider tool annotations to
  be untrusted unless they come from trusted servers.
</Warning>
