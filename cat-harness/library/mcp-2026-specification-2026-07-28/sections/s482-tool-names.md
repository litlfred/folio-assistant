---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s482-tool-names
section_title: "Tool Names"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 309-333
source_sha256: ed550806a58eb774
granularity: heading
---
#### Tool Names

- Tool names **SHOULD** be between 1 and 128 characters in length (inclusive).
- Tool names **SHOULD** be considered case-sensitive.
- The following **SHOULD** be the only allowed characters: uppercase and lowercase ASCII letters (A-Z, a-z), digits
  (0-9), underscore (\_), hyphen (-), and dot (.)
- Tool names **SHOULD NOT** contain spaces, commas, or other special characters.
- Tool names **SHOULD** be unique within a server.
- Example valid tool names:
  - `getUser`
  - `DATA_EXPORT_v2`
  - `admin.tools.list`

<Note>

Tool name uniqueness is scoped to a single server. Clients or proxies that
aggregate tools from multiple servers **MAY** encounter naming collisions (for
example, two servers each exposing a `search` tool) and **SHOULD** implement a
disambiguation strategy such as prefixing tool names with a server identifier.

The server `name` (from `serverInfo`) is not guaranteed to be unique across
servers and **SHOULD NOT** be relied upon for disambiguation.

</Note>
