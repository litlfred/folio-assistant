---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s502-cacheable-model
section_title: "Cacheable Model"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 39-45
source_sha256: ca416e94b40c067d
granularity: heading
---
## Cacheable Model

Cacheable Results in MCP use two fields to provide caching hints to clients:

- The <b>Time-to-live (TTL) Field</b>,`ttlMs`, is an integer value in milliseconds specifying how long the client MAY consider the result fresh.
- The <b>Cache Scope Field</b>,`cacheScope`, indicates the intended scope of the cached response, either `"public"` or `"private"`.
