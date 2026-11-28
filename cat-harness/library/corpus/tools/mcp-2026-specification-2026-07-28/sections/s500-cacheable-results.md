---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s500-cacheable-results
section_title: "Cacheable Results"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 11-26
source_sha256: ca416e94b40c067d
granularity: heading
---
## Cacheable Results

Servers MUST include caching hints on results with `resultType: "complete"` returned by
the following operations:

- `server/discover`
- `tools/list`
- `prompts/list`
- `resources/list`
- `resources/templates/list`
- `resources/read`

Interim results with `resultType: "input_required"` (see
[multi round-trip requests](/specification/2026-07-28/basic/patterns/mrtr)) are not cacheable
and carry no caching hints.
