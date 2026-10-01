---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s508-interaction-with-pagination
section_title: "Interaction with Pagination"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 147-170
source_sha256: ca416e94b40c067d
granularity: heading
---
## Interaction with Pagination

When a list result is [paginated](/specification/2026-07-28/server/utilities/pagination), each
page is an independently cacheable response&mdash;consistent with how HTTP
`Cache-Control` treats paginated resources.

- Each page response carries its own `ttlMs` value. The freshness clock for each page
  starts at the time that page was received.
- Servers **MAY** return different `ttlMs` values on different pages (e.g., a longer TTL
  for early pages of a stable list, a shorter TTL for the final page).
- When a cached page expires, the client **SHOULD** re-fetch that page using its cursor.
- There is no cross-page consistency guarantee. If the underlying data changes between
  page fetches, clients may observe duplicates or gaps.
- Clients that require a consistent snapshot of the full list **SHOULD** re-fetch from
  the beginning (without a cursor).
- If a cursor becomes invalid (e.g., the server returns an error for a previously valid
  cursor), the client **SHOULD** discard all cached pages and re-fetch from the
  beginning.

Servers **MUST** apply the same `cacheScope` to all response pages for a given list
request. For example, if the first page of a `tools/list` response has
`cacheScope: "private"`, all subsequent pages for that request **MUST** also be
`"private"`.
