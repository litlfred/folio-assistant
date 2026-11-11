---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s450-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 39-82
source_sha256: 10538119019af5f4
granularity: heading
---
## Capabilities

Servers that support resources **MUST** declare the `resources` capability:

```json
{
  "capabilities": {
    "resources": {
      "listChanged": true,
      "subscribe": true
    }
  }
}
```

The capability supports two optional features:

- `listChanged`: whether the server will emit notifications when the list of available
  resources changes.
- `subscribe` : whether the server supports resource-specific update notifications
  for resources requested through subscriptions/listen using the resourceSubscriptions
  filter.

Servers may advertise either feature independently, together or neither.

Servers that support neither `listChanged` nor `subscribe` may omit it:

```json
{
  "capabilities": {
    "resources": {}
  }
}
```

Servers that declare the `resources` capability **MUST** respond to `resources/list`
requests with the set of resources currently available to the requesting client. This set
**MAY** be empty and **MAY** change over time (see
[List Changed Notification](#list-changed-notification)), but **MUST NOT** vary
per-connection or as a side effect of other requests on the connection. The set
**MAY** vary by the authorization presented on the request — for example, returning
only the resources the caller's granted scopes permit — since credentials are
per-request input, not connection state.
