---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s104-overview
section_title: "Overview"
file: "docs/specification/2026-07-28/basic/patterns/index.mdx"
lines: 1-22
source_sha256: 9e08dd8b295cacc5
granularity: heading
---
---
title: Overview
---

<div id="enable-section-numbers" />

This page defines the message patterns of the core protocol: the ways a
client and server compose JSON-RPC
[requests, responses, and notifications](/specification/2026-07-28/basic/index#messages)
into interactions. Every
[transport](/specification/2026-07-28/basic/transports) carries all of these
patterns; transports differ only in how messages are framed and delivered.

Every interaction begins with the client:

- The **client** sends JSON-RPC _requests_ and _notifications_.
- The **server** answers each request with a JSON-RPC _response_ (a result
  or error), optionally preceded by _notifications_ scoped to that request.

Servers **MUST NOT** initiate JSON-RPC requests, and clients do not send
JSON-RPC responses.
