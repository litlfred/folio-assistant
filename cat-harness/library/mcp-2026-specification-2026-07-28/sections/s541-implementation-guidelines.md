---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s541-implementation-guidelines
section_title: "Implementation Guidelines"
file: "docs/specification/2026-07-28/server/utilities/pagination.mdx"
lines: 92-108
source_sha256: c4c7b674ae9ce16c
granularity: heading
---
## Implementation Guidelines

1. Servers **SHOULD**:
   - Provide stable cursors
   - Handle invalid cursors gracefully

2. Clients **SHOULD**:
   - Treat a missing `nextCursor` as the end of results
   - Support both paginated and non-paginated flows

3. Clients **MUST** treat cursors as opaque tokens:
   - Don't make assumptions about cursor format
   - Don't attempt to parse or modify cursors
   - Don't make any determination based on cursor value other than whether a
     non-null value was provided (e.g. an empty string is a valid cursor and
     thus **MUST NOT** be treated as the end of results)
