---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s096-cancellation
section_title: "Cancellation"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 1-15
source_sha256: 396030784a4af9b7
granularity: heading
---
---
title: Cancellation
---

<div id="enable-section-numbers" />

The Model Context Protocol (MCP) supports optional cancellation of in-progress requests
through notification messages. A client **SHOULD** send a cancellation notification
to indicate that a request it previously issued should be terminated.

A server **MUST** send `notifications/cancelled`
referencing a `subscriptions/listen` request ID when it tears down that subscription
stream (see [Subscriptions][subscriptions]). Servers **MUST NOT** send
`notifications/cancelled` for any other purpose.
