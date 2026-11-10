---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s503-time-to-live-ttl-field
section_title: "Time-to-Live (TTL) Field"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 46-68
source_sha256: ca416e94b40c067d
granularity: heading
---
### Time-to-Live (TTL) Field

The `ttlMs` field is a hint from the server indicating how long, in
milliseconds, the client MAY consider the result fresh. Semantics are
analogous to HTTP `Cache-Control: max-age`.

- If `ttlMs` is `0`, the response **SHOULD** be considered immediately stale. The client
  MAY re-fetch every time the result is needed.
- If `ttlMs` is positive, the client **SHOULD** consider the result fresh for that many
  milliseconds after receiving the response.
- If `ttlMs` is absent, clients **SHOULD** assume a default of `0` (immediately stale)
  and rely on their own caching heuristics or notifications. This should only occur in older server versions.
- If `ttlMs` is negative, clients **SHOULD** ignore it and treat it as `0`.

Servers **MUST** provide a `ttlMs` value that is `>= 0`.

<Note>
  TTL is a **freshness hint**, not a guarantee. Servers MAY change the
  underlying data before the TTL expires. The TTL tells the client how long it
  can reasonably avoid re-fetching, not how long the data is guaranteed to
  remain unchanged.
</Note>
