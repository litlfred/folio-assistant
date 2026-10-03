---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s133-overview
section_title: "Overview"
file: "docs/specification/2026-07-28/basic/transports/index.mdx"
lines: 1-26
source_sha256: 59cc01897f5efadc
granularity: heading
---
---
title: Overview
---

<div id="enable-section-numbers" />

This page defines what a transport must provide to carry MCP messages, the
standard transport bindings, and the requirements for defining new ones.

Protocol semantics are identical on every transport. A transport is a
**binding**: it defines how messages are framed and delivered, how request
metadata is carried, and how cancellation and termination are signaled. It
does not define what the messages mean: the
[message patterns](/specification/2026-07-28/basic/patterns) are part of the core
protocol and are the same on every binding. The binding pages specify the
standard transports:

1. [stdio](/specification/2026-07-28/basic/transports/stdio): newline-delimited
   messages over the standard streams of a client-launched subprocess.
2. [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http):
   each message is an HTTP POST to a single MCP endpoint; replies arrive as
   a JSON object or a request-scoped SSE stream.

It is also possible for clients and servers to implement
[custom transports](#custom-transports).
