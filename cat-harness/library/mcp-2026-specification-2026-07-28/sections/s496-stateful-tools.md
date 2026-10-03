---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s496-stateful-tools
section_title: "Stateful Tools"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 683-737
source_sha256: ed550806a58eb774
granularity: heading
---
## Stateful Tools

<Note>

This section is non-normative guidance for tool design. The protocol has no
concept of a state handle; from the wire's perspective a handle is an ordinary
string in a tool result and an ordinary argument to subsequent tool calls.

</Note>

MCP has no protocol-level session, so a server cannot rely on implicit
per-connection state to relate one tool call to the next. Servers that need to
maintain state across calls — a shopping cart, an open browser context, a
database transaction — should do so by returning an explicit handle from a
creation tool and accepting that handle as an argument on subsequent calls.

For example, a server that manages a shopping cart might expose:

```jsonc
// → tools/call
{ "name": "create_basket", "arguments": {} }

// ← result
{
  "content": [{ "type": "text", "text": "Created basket bsk_a1b2c3" }],
  "structuredContent": { "basket_id": "bsk_a1b2c3" }
}

// → tools/call
{
  "name": "add_item",
  "arguments": { "basket_id": "bsk_a1b2c3", "sku": "..." }
}
```

The model is responsible for carrying `basket_id` forward; the server stores
the cart contents under that key and looks them up on each call.

When designing handles, servers should consider:

- **Authorization.** For authenticated servers, a handle is a name, not a
  capability. The server should validate the caller's authorization against the
  handle on every call. For unauthenticated servers, where the handle is
  necessarily a bearer token, it should be generated with sufficient entropy
  (e.g., a UUIDv4) and given a bounded lifetime.
- **Opacity.** Handles that encode internal structure invite parsing or
  guessing; opaque identifiers do not.
- **Lifetime.** Because handles outlive any single connection, the server's
  retention policy should be stated in the creation tool's description (e.g.,
  "baskets expire after 24 hours of inactivity") so the model can see it when
  deciding to create state.
- **Expiry errors.** A call against an expired or unknown handle should return
  a tool execution error that says so, so the model can recover by creating a
  new one.
