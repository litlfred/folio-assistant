---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s473-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 45-75
source_sha256: ed550806a58eb774
granularity: heading
---
## Capabilities

Servers that support tools **MUST** declare the `tools` capability:

```json
{
  "capabilities": {
    "tools": {
      "listChanged": true
    }
  }
}
```

`listChanged` indicates whether the server will emit notifications when the list of
available tools changes.

Servers that declare the `tools` capability **MUST** respond to `tools/list` requests
with the set of tools currently available to the requesting client. This set **MAY** be
empty and **MAY** change over time (see
[List Changed Notification](#list-changed-notification)), but **MUST NOT** vary
per-connection or as a side effect of other requests on the connection. The set
**MAY** vary by the authorization presented on the request — for example, returning
only the tools the caller's granted scopes permit — since credentials are
per-request input, not connection state.

Servers **SHOULD** return tools in a deterministic order (i.e., the same ordering across
requests when the underlying set of tools has not changed). Deterministic ordering enables
clients to reliably cache the tool list and improves LLM prompt cache hit rates when tools
are included in model context.
