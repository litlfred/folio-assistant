---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s470-security-considerations
section_title: "Security Considerations"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 428-435
source_sha256: 10538119019af5f4
granularity: heading
---
## Security Considerations

1. Servers **MUST** validate all resource URIs
2. Access controls **SHOULD** be implemented for sensitive resources
3. Binary data **MUST** be properly encoded
4. Resource permissions **SHOULD** be checked before operations
5. Servers **MUST** sanitize file paths to prevent directory traversal attacks
   when serving `file://` resources
