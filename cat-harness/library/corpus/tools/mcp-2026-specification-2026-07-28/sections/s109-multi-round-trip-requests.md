---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s109-multi-round-trip-requests
section_title: "Multi Round-Trip Requests"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 1-24
source_sha256: a8671eb2a0d292c0
granularity: heading
---
---
title: Multi Round-Trip Requests
---

<div id="enable-section-numbers" />

<Note>
  Multi Round-Trip Requests (MRTR) was introduced in this version of the MCP
  specification. This replaces the previous approach of sending server-initiated
  requests. Servers **MUST** send server-to-client requests (such as
  `roots/list`, `sampling/createMessage`, or `elicitation/create`) using the
  MRTR pattern. The previous pattern of server-initiated requests is no longer
  supported. This is a breaking change.
</Note>

<Note>
  For brevity, the request examples on this page omit the `_meta` request
  metadata (`io.modelcontextprotocol/protocolVersion`,
  `io.modelcontextprotocol/clientInfo`, and
  `io.modelcontextprotocol/clientCapabilities`). Every request **MUST** include
  the required `_meta` fields; see
  [`_meta`](/specification/2026-07-28/basic/index#meta).
</Note>
