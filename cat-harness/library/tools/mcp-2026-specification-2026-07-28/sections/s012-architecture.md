---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s012-architecture
section_title: "Architecture"
file: "docs/specification/2026-07-28/architecture/index.mdx"
lines: 1-14
source_sha256: 9037b342a1f23c05
granularity: heading
---
---
title: Architecture
---

<div id="enable-section-numbers" />

The Model Context Protocol (MCP) follows a client-host-server architecture where each
host can run multiple client instances. MCP is a stateless protocol: every request is
self-contained and carries its own protocol version and capabilities.
This architecture enables users to integrate AI capabilities across applications while
maintaining clear security boundaries and isolating concerns. Built on JSON-RPC, MCP
provides a protocol focused on context exchange and sampling coordination between
clients and servers.
