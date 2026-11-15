---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s219-implementation-guidelines
section_title: "Implementation Guidelines"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 148-159
source_sha256: 016aea34d76ccce8
granularity: heading
---
## Implementation Guidelines

1. Clients **SHOULD**:
   - Prompt users for consent before exposing roots to servers
   - Provide clear user interfaces for root management
   - Validate root accessibility before exposing
   - Monitor for root changes

2. Servers **SHOULD**:
   - Check for roots capability before usage
   - Respect root boundaries in operations
   - Cache root information appropriately
