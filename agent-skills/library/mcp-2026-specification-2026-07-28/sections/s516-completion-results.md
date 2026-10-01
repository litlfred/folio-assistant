---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s516-completion-results
section_title: "Completion Results"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 142-149
source_sha256: 1965c563aadb99e1
granularity: heading
---
### Completion Results

Servers return an array of completion values ranked by relevance, with:

- Maximum 100 items per response
- Optional total number of available matches
- Boolean indicating if additional results exist
