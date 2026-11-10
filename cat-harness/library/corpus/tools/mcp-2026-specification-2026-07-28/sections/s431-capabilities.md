---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s431-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 39-65
source_sha256: 85e550635bbbbaa9
granularity: heading
---
## Capabilities

Servers that support prompts **MUST** declare the `prompts` capability in their
[`DiscoverResult`](/specification/2026-07-28/schema#discoverresult):

```json
{
  "capabilities": {
    "prompts": {
      "listChanged": true
    }
  }
}
```

`listChanged` indicates whether the server will emit notifications when the list of
available prompts changes.

Servers that declare the `prompts` capability **MUST** respond to `prompts/list` requests
with the set of prompts currently available to the requesting client. This set **MAY** be
empty and **MAY** change over time (see
[List Changed Notification](#list-changed-notification)), but **MUST NOT** vary
per-connection or as a side effect of other requests on the connection. The set
**MAY** vary by the authorization presented on the request — for example, returning
only the prompts the caller's granted scopes permit — since credentials are
per-request input, not connection state.
