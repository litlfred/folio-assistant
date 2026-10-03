---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s120-security-considerations
section_title: "Security Considerations"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 269-272
source_sha256: a8671eb2a0d292c0
granularity: heading
---
### Security Considerations

Because `requestState` passes through the client, malicious or compromised clients could attempt to modify it to alter server behavior,
bypass authorization checks, or corrupt server logic. Servers **MUST** validate request state as described in the [server requirements](#server-requirements-basic-workflow) above.
