---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s077-error-responses
section_title: "Error Responses"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 87-108
source_sha256: 03586b10e3214c55
granularity: heading
---
#### Error Responses

[Error responses](/specification/2026-07-28/schema#jsonrpcerrorresponse) are sent when the operation fails or encounters an error.

```typescript
{
  jsonrpc: "2.0";
  id?: string | number;
  error: {
    code: number;
    message: string;
    data?: unknown;
  }
}
```

- Error responses **MUST** include the same ID as the request they correspond to (except in error cases where the ID could not be read due a malformed request).
- Error responses **MUST** include an `error` field with a `code` and `message`.
- Error codes **MUST** be integers.
- Error responses **MAY** include a `data` member with additional information of any type, such
  as nested errors.
