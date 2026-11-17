---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s139-stdio
section_title: "stdio"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 1-32
source_sha256: 6fd49766c40dc093
granularity: heading
---
---
title: stdio
---

<div id="enable-section-numbers" />

In the **stdio** transport, the client launches the MCP server as a subprocess.
The two ends communicate over the subprocess's standard streams:

- The server reads JSON-RPC messages from `stdin` and writes JSON-RPC messages to
  `stdout`.
- Each message is a single JSON-RPC request, notification, or response.
- Messages are delimited by newlines, and **MUST NOT** contain embedded newlines.
- The server **MAY** write UTF-8 strings to `stderr` for any logging purposes
  including informational, debug, and error messages.
- The client **MAY** capture, forward, or ignore the server's `stderr` output and
  **SHOULD NOT** assume `stderr` output indicates error conditions.
- The server **MUST NOT** write anything to its `stdout` that is not a valid MCP
  message.
- The client **MUST NOT** write anything to the server's `stdin` that is not a
  valid MCP message.

Standard streams are the canonical channel, but nothing in this binding
depends on them except the process lifecycle. The wire format (one
newline-delimited JSON-RPC message per line over a reliable bidirectional
byte stream) works unchanged over Unix domain sockets, TCP connections, or
any similar channel.
[Custom transports](/specification/2026-07-28/basic/transports#custom-transports)
built on such streams **SHOULD** reuse this framing and the message rules on
this page; only the subprocess-specific aspects (launch, `stderr`, shutdown
by closing the stream, process restart) need channel-specific equivalents.
