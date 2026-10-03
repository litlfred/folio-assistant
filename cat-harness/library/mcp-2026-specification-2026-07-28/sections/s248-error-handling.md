---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s248-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 662-666
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
## Error Handling

If an error occurs or the user declines the sampling request, the client does not need to replay the initial call with an
error message, as the server is not waiting for a response with the `InputRequiredResult` pattern.
