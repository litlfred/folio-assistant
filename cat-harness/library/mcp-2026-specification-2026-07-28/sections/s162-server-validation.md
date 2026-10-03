---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s162-server-validation
section_title: "Server Validation"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 580-649
source_sha256: 22574bf11e004068
granularity: heading
---
### Server Validation

Servers that process the request body **MUST** reject requests where the
values specified in the headers do not match the corresponding values in the
request body. This prevents potential security vulnerabilities when
different components in the network rely on different sources of truth
(e.g., a load balancer routing on the header value while the MCP server
executes based on the body value).

<Note>

When validating integer parameter values, servers **SHOULD** compare the
header value and the body value numerically rather than as strings (e.g.,
`42.0` and `42` are considered equal).

</Note>

When rejecting a request due to header validation failure, servers **MUST**
return HTTP status `400 Bad Request` and **MUST** include a JSON-RPC error
response using the following error code:

| Code     | Name                                                                     | Description                                                                                                            |
| -------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `-32020` | [`HeaderMismatch`](/specification/2026-07-28/schema#headermismatcherror) | The HTTP headers do not match the corresponding values in the request body, or required headers are missing/malformed. |

This error code is allocated from the sub-range the MCP specification
reserves for protocol-defined errors. See
[Error Codes](/specification/2026-07-28/basic/index#error-codes).

**Example error response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32020,
    "message": "Header mismatch: Mcp-Name header value 'foo' does not match body value 'bar'"
  }
}
```

Validation failure conditions include:

- A required standard header (`MCP-Protocol-Version`, `Mcp-Method`,
  `Mcp-Name`) is missing.
- A header value does not match the corresponding request body value.
  For headers that permit the Base64 sentinel encoding (`Mcp-Name` and
  `Mcp-Param-{Name}`), servers **MUST** decode encoded values (see
  [Value Encoding](#value-encoding)) before comparing them to the body value.
- A header value contains invalid characters.

<Note>

Intermediaries **MUST** return an appropriate HTTP error status (e.g.,
`400 Bad Request`) for validation failures but are not required to return
a JSON-RPC error response.

</Note>

<Note>

Intermediaries that enforce policy based on mirrored headers (e.g., routing
or rate-limiting by tenant) **SHOULD** verify that the `MCP-Protocol-Version`
header indicates a version that requires header–body validation. If the
version is older or the header is absent, the intermediary **SHOULD** reject
the request rather than trusting unvalidated header values.

</Note>
