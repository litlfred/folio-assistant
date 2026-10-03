---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s533-implementation-considerations
section_title: "Implementation Considerations"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 107-120
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
## Implementation Considerations

1. Servers **SHOULD**:
   - Rate limit log messages
   - Include relevant context in data field
   - Use consistent logger names
   - Remove sensitive information

2. Clients **MAY**:
   - Present log messages in the UI
   - Implement log filtering/search
   - Display severity visually
   - Persist log messages
