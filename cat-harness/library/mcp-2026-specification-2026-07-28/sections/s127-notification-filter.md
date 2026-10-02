---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s127-notification-filter
section_title: "Notification Filter"
file: "docs/specification/2026-07-28/basic/patterns/subscriptions.mdx"
lines: 40-51
source_sha256: 8333cbc3280cad29
granularity: heading
---
### Notification Filter

| Field                   | Type       | Description                                                       |
| ----------------------- | ---------- | ----------------------------------------------------------------- |
| `toolsListChanged`      | `boolean`  | Receive `notifications/tools/list_changed` when tools change      |
| `promptsListChanged`    | `boolean`  | Receive `notifications/prompts/list_changed` when prompts change  |
| `resourcesListChanged`  | `boolean`  | Receive `notifications/resources/list_changed` when list changes  |
| `resourceSubscriptions` | `string[]` | Receive `notifications/resources/updated` for these resource URIs |

All fields are optional. Omitting a field is equivalent to not subscribing to that
notification type.
