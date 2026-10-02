---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s478-list-changed-notification
section_title: "List Changed Notification"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 236-249
source_sha256: ed550806a58eb774
granularity: heading
---
### List Changed Notification

When the list of available tools changes, servers that declared the `listChanged`
capability **SHOULD** send a notification to clients that have opened a
[`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions) stream with
`toolsListChanged: true`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```
