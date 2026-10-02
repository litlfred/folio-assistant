---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s524-logging
section_title: "Logging"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 1-24
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
---
title: Logging
---

<div id="enable-section-numbers" />

<Warning>
  **Deprecated**: The Logging feature is deprecated as of protocol version
  `2026-07-28`
  ([SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)).
  Under the [feature lifecycle policy](/community/feature-lifecycle), it remains
  in the specification for at least twelve months after this revision's release
  before it becomes eligible for removal. New implementations **SHOULD NOT**
  adopt it; existing implementations **SHOULD** migrate to logging to `stderr`
  for stdio transports, or to [OpenTelemetry](https://opentelemetry.io/) for
  structured observability. See the [deprecated features
  registry](/specification/2026-07-28/deprecated).
</Warning>

The Model Context Protocol (MCP) provides a standardized way for servers to send
structured log messages to clients. Clients control logging verbosity per-request via
`_meta`, with servers sending notifications containing severity levels, optional logger
names, and arbitrary JSON-serializable data.
