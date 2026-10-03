---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s535-pagination
section_title: "Pagination"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 1-23
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
---
title: Pagination
---

<div id="enable-section-numbers" />

The Model Context Protocol (MCP) supports paginating list operations that may return
large result sets. Pagination allows servers to yield results in smaller chunks rather
than all at once.

Pagination is especially important when connecting to external services over the
internet, but also useful for local integrations to avoid performance issues with large
data sets.

<Note>
  For brevity, the request examples on this page omit the `_meta` request
  metadata (`io.modelcontextprotocol/protocolVersion`,
  `io.modelcontextprotocol/clientInfo`, and
  `io.modelcontextprotocol/clientCapabilities`). Every request **MUST** include
  the required `_meta` fields; see
  [`_meta`](/specification/2026-07-28/basic/index#meta).
</Note>
