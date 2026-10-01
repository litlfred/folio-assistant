---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s014-host
section_title: "Host"
file: "docs/specification/2026-07-28/architecture/index.mdx"
lines: 50-60
source_sha256: 9037b342a1f23c05
granularity: heading
---
### Host

The host process acts as the container and coordinator:

- Creates and manages multiple client instances
- Controls client connection permissions and lifecycle
- Enforces security policies and consent requirements
- Handles user authorization decisions
- Coordinates AI/LLM integration and sampling
- Manages context aggregation across clients
