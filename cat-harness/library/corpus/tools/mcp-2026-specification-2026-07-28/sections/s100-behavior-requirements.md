---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s100-behavior-requirements
section_title: "Behavior Requirements"
file: "docs/specification/2026-07-28/basic/patterns/cancellation.mdx"
lines: 66-83
source_sha256: 396030784a4af9b7
granularity: heading
---
## Behavior Requirements

1. Cancellation notifications **MUST** only reference requests that:
   - Were previously issued by the client
   - Are believed to still be in-progress
1. Server-sent cancellation notifications **MUST** reference a
   `subscriptions/listen` request, to terminate that subscription stream
1. Servers receiving cancellation notifications **SHOULD**:
   - Stop processing the cancelled request
   - Free associated resources
   - Not send a response for the cancelled request
1. Servers **MAY** ignore cancellation notifications if:
   - The referenced request is unknown
   - Processing has already completed
   - The request cannot be cancelled
1. The client **SHOULD** ignore any response to the cancelled request that arrives
   afterward
