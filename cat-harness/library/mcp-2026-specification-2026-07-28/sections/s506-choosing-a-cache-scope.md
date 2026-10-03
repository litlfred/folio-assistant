---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s506-choosing-a-cache-scope
section_title: "Choosing a Cache Scope"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 103-109
source_sha256: ca416e94b40c067d
granularity: heading
---
#### Choosing a Cache Scope

- **`"public"`** is appropriate for lists of tools, prompts, and resource templates when
  they are identical for all users.
- **`"private"`** is appropriate for `resources/read` results that depend on the
  authenticated user, or for filtered list results that vary per user.
