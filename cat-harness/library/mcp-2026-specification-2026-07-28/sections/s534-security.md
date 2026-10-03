---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s534-security
section_title: "Security"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 121-132
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
## Security

1. Log messages **MUST NOT** contain:
   - Credentials or secrets
   - Personal identifying information
   - Internal system details that could aid attacks

2. Implementations **SHOULD**:
   - Rate limit messages
   - Validate all data fields
   - Control log access
   - Monitor for sensitive content
