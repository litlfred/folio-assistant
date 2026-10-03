---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s057-mcp-authorization-extensions
section_title: "MCP Authorization Extensions"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 415-424
source_sha256: 99e7eeaecad53816
granularity: heading
---
## MCP Authorization Extensions

There are several authorization extensions to the core protocol that define additional authorization mechanisms. These extensions are:

- **Optional** - Implementations can choose to adopt these extensions
- **Additive** - Extensions do not modify or break core protocol functionality; they add new capabilities while preserving core protocol behavior
- **Composable** - Extensions are modular and designed to work together without conflicts, allowing implementations to adopt multiple extensions simultaneously
- **Versioned independently** - Extensions follow the core MCP versioning cycle but may adopt independent versioning as needed

A list of supported extensions can be found in the [MCP Authorization Extensions](https://github.com/modelcontextprotocol/ext-auth) repository.
