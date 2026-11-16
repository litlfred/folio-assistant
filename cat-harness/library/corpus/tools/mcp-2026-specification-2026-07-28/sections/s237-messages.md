---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s237-messages
section_title: "Messages"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 521-530
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Messages

Sampling messages **MUST** contain a `role` field of `"user"` or `"assistant"`; and
a `content` field representing the message data.

The list of messages in a sampling request **SHOULD NOT** be retained between
separate requests.

The `content` field can contain:
