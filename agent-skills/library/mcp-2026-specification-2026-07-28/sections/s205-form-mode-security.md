---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s205-form-mode-security
section_title: "Form Mode Security"
file: "docs/specification/2026-07-28/client/elicitation.mdx"
lines: 635-640
source_sha256: 74351d1081681695
granularity: heading
---
### Form Mode Security

1. Servers **MUST NOT** request sensitive information (passwords, API keys, etc.) via form mode
2. Clients **SHOULD** validate all responses against the provided schema
3. Servers **SHOULD** validate received data matches the requested schema
