---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s507-interaction-with-notifications
section_title: "Interaction with Notifications"
file: "docs/specification/2026-07-28/server/utilities/caching.mdx"
lines: 110-146
source_sha256: ca416e94b40c067d
granularity: heading
---
## Interaction with Notifications

TTL and server-push notifications are complementary:

- A server **MAY** provide `ttlMs` without advertising `listChanged: true` in its
  capabilities. In this case, the client relies entirely on TTL-based freshness.
- A server **MAY** advertise `listChanged: true` **and** provide `ttlMs`. In this case,
  the client can use the TTL to avoid unnecessary refetches between notifications, and
  the notification acts as an immediate invalidation signal.

When a relevant notification is received while a cached response is still fresh, the
notification **invalidates** the cached response and it should be considered immediately stale.

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: tools/list
    Server-->>Client: { tools: [...], ttlMs: 300000 }
    Note over Client: Cache response, fresh for 5 min

    Note over Client: 2 minutes later...
    Client->>Client: Need tools list → cache still fresh, use cached

    Note over Client: 3 minutes later (TTL expired)...
    Client->>Client: Need tools list → cache stale
    Client->>Server: tools/list
    Server-->>Client: { tools: [...], ttlMs: 300000 }

    Note over Server: Tools change before TTL expires
    Server-->>Client: notifications/tools/list_changed
    Note over Client: Invalidate cache immediately
    Client->>Server: tools/list
    Server-->>Client: { tools: [...], ttlMs: 300000 }
```
