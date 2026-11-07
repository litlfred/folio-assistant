---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s427-discoverresult
section_title: "DiscoverResult"
file: "docs/specification/2026-07-28/server/discover.mdx"
lines: 90-108
source_sha256: 3fe1f5b5f1528014
granularity: heading
---
### DiscoverResult

A discovery result includes:

- `supportedVersions`: Protocol versions the server supports. The client should
  choose one of these for subsequent requests.
- `capabilities`: Capabilities the server supports (tools, resources, prompts,
  etc.)
- `_meta['io.modelcontextprotocol/serverInfo']`: Name and version of the server
  software. Servers **SHOULD** include this field.
- `instructions`: Optional natural-language guidance for LLMs on how to use
  this server effectively

<Note>
  `serverInfo` is self-reported by the server and is not verified by the
  protocol. It is intended for display, logging, and debugging. Clients **SHOULD
  NOT** use it to change their behavior, and **SHOULD NOT** rely on it for
  security decisions.
</Note>
