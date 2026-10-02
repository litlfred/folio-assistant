---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s531-log-message-notifications
section_title: "Log Message Notifications"
file: "docs/specification/2026-07-28/server/utilities/logging.mdx"
lines: 76-97
source_sha256: 4e77ec3257e07ad6
granularity: heading
---
### Log Message Notifications

Servers send log messages using `notifications/message` notifications:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/message",
  "params": {
    "level": "error",
    "logger": "database",
    "data": {
      "error": "Connection failed",
      "details": {
        "host": "localhost",
        "port": 5432
      }
    }
  }
}
```
