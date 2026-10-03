---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s125-subscriptions
section_title: "Subscriptions"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 1-11
source_sha256: 8333cbc3280cad29
granularity: heading
---
---
title: Subscriptions
---

<div id="enable-section-numbers" />

`subscriptions/listen` opens a long-lived notification stream from the server to the
client. Unlike one-off requests, the stream stays open and delivers notifications until
the client cancels it. It replaces the former `resources/subscribe` RPC and the HTTP GET
endpoint.
