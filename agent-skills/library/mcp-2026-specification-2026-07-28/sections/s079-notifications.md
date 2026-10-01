---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s079-notifications
section_title: "Notifications"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 157-173
source_sha256: 03586b10e3214c55
granularity: heading
---
### Notifications

[Notifications](/specification/2026-07-28/schema#jsonrpcnotification) are sent from the client to the server or vice versa, as a one-way message.
The receiver **MUST NOT** send a response.

```typescript
{
  jsonrpc: "2.0";
  method: string;
  params?: {
    [key: string]: unknown;
  };
}
```

- Notifications **MUST NOT** include an ID.
