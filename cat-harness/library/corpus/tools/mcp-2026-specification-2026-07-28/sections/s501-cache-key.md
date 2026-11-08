---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s501-cache-key
section_title: "Cache Key"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 27-38
source_sha256: ca416e94b40c067d
granularity: heading
---
## Cache Key

A cached response is identified by the request method together with the request
parameters that affect the result (for example, the `uri` for `resources/read`, or the
`cursor` for paginated list requests). Clients **MUST NOT** serve a cached response for
a request whose method or parameters differ from the request that produced it.

Results produced by retrying a request through the
[multi round-trip requests](/specification/2026-07-28/basic/patterns/mrtr) mechanism&mdash;that
is, requests carrying `inputResponses` or `requestState`&mdash;**MUST NOT** be cached,
as they depend on inputs that are not part of the cache key.
