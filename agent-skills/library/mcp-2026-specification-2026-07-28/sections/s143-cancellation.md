---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s143-cancellation
section_title: "Cancellation"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 76-86
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Cancellation

To cancel an in-flight request, the client **MUST** send a
`notifications/cancelled` notification referencing the request's ID. Because
stdio is a single shared bidirectional channel, there is no per-request stream
to close. Servers **SHOULD** stop work on a cancelled request as soon as
practical and **MUST NOT** send any further messages for it. See
[Cancellation][cancellation] for the full rules.

[cancellation]: /specification/2026-07-28/basic/patterns/cancellation
