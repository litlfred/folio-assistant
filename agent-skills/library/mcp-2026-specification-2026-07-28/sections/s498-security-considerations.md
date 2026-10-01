---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s498-security-considerations
section_title: "Security Considerations"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 787-803
source_sha256: ed550806a58eb774
granularity: heading
---
## Security Considerations

1. Servers **MUST**:
   - Validate all tool inputs
   - Implement proper access controls
   - Rate limit tool invocations
   - Sanitize tool outputs

2. Clients **SHOULD**:
   - Prompt for user confirmation on sensitive operations
   - Show tool inputs to the user before calling the server, to avoid malicious or
     accidental data exfiltration
   - Validate tool results before passing to LLM
   - Follow the [`$ref` resolution requirements](/specification/2026-07-28/basic/index#ref-resolution)
     when validating tool inputs and outputs against `inputSchema` and `outputSchema`
   - Implement timeouts for tool calls
   - Log tool usage for audit purposes
