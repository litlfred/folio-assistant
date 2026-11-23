---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s207-roots
section_title: "Roots"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 1-25
source_sha256: 016aea34d76ccce8
granularity: heading
---
---
title: Roots
---

<div id="enable-section-numbers" />

<Warning>
  **Deprecated**: The Roots feature is deprecated as of protocol version
  `2026-07-28`
  ([SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)).
  Under the [feature lifecycle policy](/community/feature-lifecycle), it remains
  in the specification for at least twelve months after this revision's release
  before it becomes eligible for removal. New implementations **SHOULD NOT**
  adopt it; existing implementations **SHOULD** migrate to passing directories
  or files via tool parameters, resource URIs, or server configuration. See the
  [deprecated features registry](/specification/2026-07-28/deprecated).
</Warning>

The Model Context Protocol (MCP) provides a standardized way for clients to expose
filesystem "roots" to servers. Roots inform servers about the directories and files the
client considers relevant, so that servers can focus their operations accordingly. They
are informational guidance rather than an access-control mechanism. The protocol does
not enforce that servers stay within roots. Servers can request the list of roots from
supporting clients.
