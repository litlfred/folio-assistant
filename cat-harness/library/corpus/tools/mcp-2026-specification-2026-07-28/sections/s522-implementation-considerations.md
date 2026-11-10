---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s522-implementation-considerations
section_title: "Implementation Considerations"
file: "docs/specification/2026-07-28/server/utilities/completion.mdx"
lines: 194-206
source_sha256: 1965c563aadb99e1
granularity: heading
---
## Implementation Considerations

1. Servers **SHOULD**:
   - Return suggestions sorted by relevance
   - Implement fuzzy matching where appropriate
   - Rate limit completion requests
   - Validate all inputs

2. Clients **SHOULD**:
   - Debounce rapid completion requests
   - Cache completion results where appropriate
   - Handle missing or partial results gracefully
