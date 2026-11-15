---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s509-security-considerations
section_title: "Security Considerations"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 171-179
source_sha256: ca416e94b40c067d
granularity: heading
---
## Security Considerations

A `cacheScope` of `"public"` indicates that the response does not contain user-specific data and can be safely shared. Servers MUST be aware that responses with a `"public"` `cacheScope` may be shared between callers even if the Result is coming from an authenticated endpoint. For example, the Result from an authenticated `tools/list` call with a `"public"` `cacheScope` may be cached by a client and may be shared outside of the initial requests authorization context. (i.e. different access tokens can leverage the same cache).

Server implementors:

- should ensure that the `cacheScope` correctly reflects the intended visibility of the primitive.
- MUST apply appropriate per-primitive access controls, and MUST NOT rely on
  `cacheScope` alone to prevent unauthorized access to primitives.
