---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s091-ref-resolution
section_title: "`$ref` Resolution"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 299-311
source_sha256: 03586b10e3214c55
granularity: heading
---
### `$ref` Resolution

JSON Schema 2020-12 permits `$ref` to point at an absolute URI. Implementations **MUST NOT**
automatically dereference `$ref` values that resolve to a network URI.

Implementations **MAY** offer an opt-in mode that fetches non-local `$ref`s but it
**MUST** be disabled by default and **SHOULD** enforce an allowlist of hosts or at
minimum reject loopback, link-local, and private network addresses, apply timeouts and
size limits, and log dereferenced URIs.

Schemas that fail to validate due to an unresolved external `$ref` **SHOULD** be rejected
rather than silently treated as permissive.
