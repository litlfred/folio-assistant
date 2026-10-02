---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s089-implementation-requirements
section_title: "Implementation Requirements"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 289-294
source_sha256: 03586b10e3214c55
granularity: heading
---
### Implementation Requirements

- Clients and servers **MUST** support JSON Schema 2020-12 for schemas without an explicit `$schema` field
- Clients and servers **MUST** validate schemas according to their declared or default dialect. They **MUST** handle unsupported dialects gracefully by returning an appropriate error indicating the dialect is not supported.
- Clients and servers **SHOULD** document which schema dialects they support
