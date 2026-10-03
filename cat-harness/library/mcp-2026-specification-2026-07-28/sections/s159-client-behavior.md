---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s159-client-behavior
section_title: "Client Behavior"
file: "docs/specification/2026-07-28/basic/transports/streamable-http.mdx"
lines: 522-545
source_sha256: 22574bf11e004068
granularity: heading
---
#### Client Behavior

When constructing a `tools/call` request via HTTP transport, the client
**MUST**:

1. Extract the values for any standard headers from the request body (e.g.,
   `method`, `params.name`, `params.uri`).
2. Append the `Mcp-Method` header and, if applicable, `Mcp-Name` header to
   the request.
3. Inspect the tool's `inputSchema` for properties marked with
   `x-mcp-header` and extract the value at each annotated property's exact
   property path, omitting the header when no value is present (see
   [Schema Extension](#schema-extension)).
4. Encode the values according to the [Value Encoding](#value-encoding)
   rules.
5. Append a `Mcp-Param-{Name}: {Value}` header to the request.

If the server rejects a request with a
[`HeaderMismatch`](#server-validation) error because required
`Mcp-Param-*` headers are missing or do not match the body, the client
**SHOULD** call `tools/list` to check for changes to the tool's
`inputSchema`, then retry the original request with the appropriate
headers.
