---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s124-implementation-notes
section_title: "Implementation Notes"
file: "docs/specification/2026-07-28/basic/patterns/progress.mdx"
lines: 86-90
source_sha256: 9f55aca08920c633
granularity: heading
---
## Implementation Notes

- Clients and servers **SHOULD** track active progress tokens
- Both parties **SHOULD** implement rate limiting to prevent flooding
- Progress notifications **MUST** stop after completion
