---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s455-list-changed-notification
section_title: "List Changed Notification"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 232-243
source_sha256: 10538119019af5f4
granularity: heading
---
### List Changed Notification

When the list of available resources changes, servers that declared the `listChanged`
capability **SHOULD** send a notification:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/list_changed"
}
```
