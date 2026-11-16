---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s075-result-responses
section_title: "Result Responses"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 55-74
source_sha256: 03586b10e3214c55
granularity: heading
---
#### Result Responses

[Result responses](/specification/2026-07-28/schema#jsonrpcresultresponse) are sent when the operation completes successfully.

```typescript
{
  jsonrpc: "2.0";
  id: string | number;
  result: {
    resultType: string;
    [key: string]: unknown;
  };
}
```

- Result responses **MUST** include the same ID as the request they correspond to.
- Result responses **MUST** include a `result` field.
- The `result` **MAY** follow any JSON object structure.
- The `result` **MUST** include a `resultType` field to indicate the type of the result.
