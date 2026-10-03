---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s529-per-request-log-level
section_title: "Per-request log level"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 60-73
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
### Per-request log level

To receive log messages for a specific request, include
`io.modelcontextprotocol/logLevel` in the request's `_meta`. The server **MUST NOT**
emit `notifications/message` for a request that does not include this field.

When the field is present, the server **MAY** send `notifications/message`
notifications at or above the requested level on the response stream of that
request, before the final response. `notifications/message` is request-scoped:
the server **MUST NOT** deliver it on a
[`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions)
stream or on any stream other than the one carrying the response to the request
that set the log level.
