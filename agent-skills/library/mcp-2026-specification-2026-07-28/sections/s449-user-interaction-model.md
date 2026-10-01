---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s449-user-interaction-model
section_title: "User Interaction Model"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 22-38
source_sha256: 10538119019af5f4
granularity: heading
---
## User Interaction Model

Resources in MCP are designed to be **application-driven**, with host applications
determining how to incorporate context based on their needs.

For example, applications could:

- Expose resources through UI elements for explicit selection, in a tree or list view
- Allow the user to search through and filter available resources
- Implement automatic context inclusion, based on heuristics or the AI model's selection

![Example of resource context picker](/specification/2026-07-28/server/resource-picker.png)

However, implementations are free to expose resources through any interface pattern that
suits their needs&mdash;the protocol itself does not mandate any specific user
interaction model.
