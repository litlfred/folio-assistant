---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s511-user-interaction-model
section_title: "User Interaction Model"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 21-32
source_sha256: 1965c563aadb99e1
granularity: heading
---
## User Interaction Model

Completion in MCP is designed to support interactive user experiences similar to IDE code
completion.

For example, applications may show completion suggestions in a dropdown or popup menu as
users type, with the ability to filter and select from available options.

However, implementations are free to expose completion through any interface pattern that
suits their needs&mdash;the protocol itself does not mandate any specific user
interaction model.
