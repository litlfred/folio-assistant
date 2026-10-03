---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s505-cache-scope-field
section_title: "Cache Scope Field"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 93-102
source_sha256: ca416e94b40c067d
granularity: heading
---
### Cache Scope Field

The `cacheScope` field controls who may cache a response, analogous to HTTP
`Cache-Control: public` vs `Cache-Control: private`.

| Value       | Meaning                                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"public"`  | The response does not contain user-specific data. Any client, shared gateway, or caching proxy **MAY** store and serve the cached response to any user.                                                                                                                           |
| `"private"` | The response contains private data that is not meant to be shared between callers. Cached responses **MAY** be reused for the same authorization context. Caches **MUST NOT** be shared across authorization contexts (e.g. a different access token requires a different cache). |
