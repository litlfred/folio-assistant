---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s073-requests
section_title: "Requests"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 31-50
source_sha256: 03586b10e3214c55
granularity: heading
---
### Requests

[Requests](/specification/2026-07-28/schema#jsonrpcrequest) are sent from the client to the server, to initiate an operation.

```typescript
{
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: {
    [key: string]: unknown;
  };
}
```

- Requests **MUST** include a string or integer ID.
- Unlike base JSON-RPC, the ID **MUST NOT** be `null`.
- The request ID **MUST NOT** match the ID of any other request the sender has issued and
  not yet received a response for.
