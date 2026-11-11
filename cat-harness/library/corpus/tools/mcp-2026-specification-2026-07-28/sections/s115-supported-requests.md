---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s115-supported-requests
section_title: "Supported Requests"
file: "docs/specification/2026-07-28/basic/patterns/mrtr.mdx"
lines: 182-193
source_sha256: a8671eb2a0d292c0
granularity: heading
---
### Supported Requests

Servers **MAY** send `InputRequiredResult` responses on the following client requests:

| Client Request                                                                   | Supports InputRequiredResult |
| -------------------------------------------------------------------------------- | ---------------------------- |
| [`prompts/get`](/specification/2026-07-28/server/prompts#getting-a-prompt)       | Yes                          |
| [`resources/read`](/specification/2026-07-28/server/resources#reading-resources) | Yes                          |
| [`tools/call`](/specification/2026-07-28/server/tools#calling-tools)             | Yes                          |

Servers **MUST NOT** send `InputRequiredResult` responses on any other client requests.
