---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s157-schema-extension
section_title: "Schema Extension"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 371-466
source_sha256: 22574bf11e004068
granularity: heading
---
#### Schema Extension

The `x-mcp-header` property specifies the name portion used to construct
the header name `Mcp-Param-{name}`.

**Constraints on `x-mcp-header` values**:

- **MUST NOT** be empty
- **MUST** match HTTP field-name token syntax (`1*tchar`, [RFC 9110 Section 5.1](https://datatracker.ietf.org/doc/html/rfc9110#section-5.1))
- **MUST NOT** contain control characters, including carriage return (CR, `\r`)
  or line feed (LF, `\n`)
- **MUST** be case-insensitively unique among all `x-mcp-header` values in
  the `inputSchema`
- **MUST** only be applied to parameters with primitive types (integer,
  string, boolean). Parameters with type `number` are not permitted.
  Integer values **MUST** be within the safe range for JavaScript
  (−2<sup>53</sup>+1 to 2<sup>53</sup>−1)
- **MUST** only be applied to properties that are _statically reachable_
  from the schema root: reachable via a chain consisting solely of
  `properties` keys. The chain **MUST NOT** pass through `items` (or any
  other array keyword), composition keywords (`oneOf`, `anyOf`, `allOf`,
  `not`), conditional keywords (`if`/`then`/`else`), or `$ref`. Nested
  object properties are permitted as long as every step in the chain is a
  `properties` key. An `x-mcp-header` annotation anywhere else makes the
  annotation — and thus the tool definition — invalid.

Header extraction is defined as reading the instance value at the exact
property path of the annotated property (the chain of `properties` keys
leading to it). If no value is present at that path in the call arguments,
the header is omitted.

Clients using the Streamable HTTP transport **MUST** reject tool definitions
where any `x-mcp-header` value violates these constraints. Rejection means
the client **MUST** exclude the invalid tool from the result of `tools/list`.
Clients **SHOULD** log a warning when rejecting a tool definition, including
the tool name and the reason for rejection. This ensures that a single
malformed tool definition does not prevent other valid tools from being used.
Clients using other transports (e.g., stdio) **MAY** ignore `x-mcp-header`
annotations entirely.

**Example tool definition:**

```json
{
  "name": "execute_sql",
  "description": "Execute SQL on Google Cloud Spanner",
  "inputSchema": {
    "type": "object",
    "properties": {
      "region": {
        "type": "string",
        "description": "The region to execute the query in",
        "x-mcp-header": "Region"
      },
      "query": {
        "type": "string",
        "description": "The SQL query to execute"
      }
    },
    "required": ["region", "query"]
  }
}
```

**Resulting HTTP request:**

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: execute_sql
Mcp-Param-Region: us-west1

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "ExampleClient",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    },
    "name": "execute_sql",
    "arguments": {
      "region": "us-west1",
      "query": "SELECT * FROM users"
    }
  }
}
```
