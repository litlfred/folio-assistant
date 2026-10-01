---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s504-freshness-calculation
section_title: "Freshness Calculation"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 69-92
source_sha256: ca416e94b40c067d
granularity: heading
---
#### Freshness Calculation

A client records the local time at which the response was received (`t_received`). The
response is considered **fresh** while:

```
now < t_received + ttlMs
```

Once the TTL expires, the response is **stale** and the client **SHOULD** re-fetch on
next access.

Clients **SHOULD NOT** treat TTL as a polling interval that triggers automatic background
refetches. The TTL is a freshness hint: the client checks freshness when it needs the
data, and re-fetches only if stale. Implementations that do choose to poll **MUST**
apply jitter and backoff.

Clients **MAY** re-fetch before the TTL expires if they have reason to believe the data
has changed (e.g., receiving an unexpected error on a tool call indicating the method was
not found or the parameters were invalid).

Clients **MAY** serve stale responses if errors occur during re-fetching (e.g., network
issues, server downtime).
