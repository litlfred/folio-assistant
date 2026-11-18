---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s107-subscribe-and-notify
section_title: "Subscribe and Notify"
file: "docs/specification/2026-07-28/basic/patterns/index.mdx"
lines: 60-79
source_sha256: 9e08dd8b295cacc5
granularity: heading
---
## Subscribe and Notify

To receive change notifications (list changes, resource updates), the client
sends a
[`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions)
request; the reply is a long-lived stream of the requested notification
types. Stream state is scoped to the request: if the underlying channel is
lost, the client re-issues the request.

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: subscriptions/listen
    Server-->>Client: notifications/subscriptions/acknowledged
    note over Client,Server: Stream stays open
    Server-->>Client: notifications/* (tagged with subscriptionId)
```
