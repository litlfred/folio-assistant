---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s176-other-schema-changes
section_title: "Other schema changes"
file: "docs/specification/2026-07-28/changelog.mdx"
lines: 101-104
source_sha256: b327e576f4c96b34
granularity: heading
---
## Other schema changes

1. `schema.json` now correctly reflects that the Typescript definition of minimum/maximum/default are `number`'s and not just `integers`. This was caused by running the generator using `--defaultNumberType integer` ([PR#2710](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2710)).
