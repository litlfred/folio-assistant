---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s435-list-changed-notification
section_title: "List Changed Notification"
file: "docs/specification/2026-07-28/server/prompts.mdx"
lines: 167-180
source_sha256: 85e550635bbbbaa9
granularity: heading
---
### List Changed Notification

When the list of available prompts changes, servers that declared the `listChanged`
capability **SHOULD** send a notification to clients that have opened a
[`subscriptions/listen`](/specification/2026-07-28/basic/patterns/subscriptions) stream with
`promptsListChanged: true`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/prompts/list_changed"
}
```
