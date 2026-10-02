---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s103-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 111-122
source_sha256: 396030784a4af9b7
granularity: heading
---
## Error Handling

Invalid cancellation notifications **SHOULD** be ignored:

- Unknown request IDs
- Already completed requests
- Malformed notifications

This maintains the "fire and forget" nature of notifications while allowing for race
conditions in asynchronous communication.

[subscriptions]: /specification/2026-07-28/basic/patterns/subscriptions
