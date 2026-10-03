---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s510-completion
section_title: "Completion"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 1-20
source_sha256: 1965c563aadb99e1
granularity: heading
---
---
title: Completion
---

<div id="enable-section-numbers" />

The Model Context Protocol (MCP) provides a standardized way for servers to offer
autocompletion suggestions for the arguments of prompts and resource templates. When
users are filling in argument values for a specific prompt (identified by name) or
resource template (identified by URI), servers can provide contextual suggestions.

<Note>
  For brevity, the request examples on this page omit the `_meta` request
  metadata (`io.modelcontextprotocol/protocolVersion`,
  `io.modelcontextprotocol/clientInfo`, and
  `io.modelcontextprotocol/clientCapabilities`). Every request **MUST** include
  the required `_meta` fields; see
  [`_meta`](/specification/2026-07-28/basic/index#meta).
</Note>
