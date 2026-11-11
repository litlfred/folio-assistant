---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s092-composition-keyword-resource-use
section_title: "Composition-Keyword Resource Use"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 312-319
source_sha256: 03586b10e3214c55
granularity: heading
---
### Composition-Keyword Resource Use

Composition keywords (`anyOf`, `oneOf`, `allOf`, `if`/`then`/`else`) and `$defs` enable
expressive schemas but can be expensive to validate. Implementations **SHOULD** apply
reasonable bounds, such as a maximum schema depth, a cap on the total number of subschemas,
or a per-validation time budget, to prevent a malicious schema from acting as a Denial-of-Service
vector against the validator.
