---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s232-message-roles
section_title: "Message Roles"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 464-471
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Message Roles

MCP uses two roles: "user" and "assistant".

Tool use requests are sent in CreateMessageResult with the "assistant" role.
Tool results are sent back in messages with the "user" role.
Messages with tool results cannot contain other kinds of content.
