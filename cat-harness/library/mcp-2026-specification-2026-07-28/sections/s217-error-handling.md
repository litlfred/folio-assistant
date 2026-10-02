---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s217-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 130-134
source_sha256: 016aea34d76ccce8
granularity: heading
---
## Error Handling

If an error occurs, the client does not need to replay the initial call with an error message
as the server is not waiting for a response with the `InputRequiredResult` pattern.
