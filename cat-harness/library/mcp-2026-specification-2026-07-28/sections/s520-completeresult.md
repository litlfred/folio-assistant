---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s520-completeresult
section_title: "CompleteResult"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 178-184
source_sha256: 1965c563aadb99e1
granularity: heading
---
### CompleteResult

- `completion`: Object containing:
  - `values`: Array of suggestions (max 100)
  - `total`: Optional total matches
  - `hasMore`: Additional results flag
